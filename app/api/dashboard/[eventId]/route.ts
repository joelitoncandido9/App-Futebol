/**
 * GET /api/dashboard/{eventId}
 * Retorna dados completos do jogo + odds justas calculadas
 * Cache: revalidate 15 minutos
 *
 * Usa v1 para o core (form, h2h, coach, referee, incidents, lineups, stats)
 * Usa v2 para dados extras: prediction, player-stats, metadata, broadcasts
 */

import { gerarCardsMercado } from '@/lib/odds-jtsa';
import { traduzirFato } from '@/lib/utils';
import { buscarHistoricoTime, formatarComoFormData, buscarUltimosJogos } from '@/lib/bsd-stats';
import { cacheFetch, makeBsdCacheKey } from '@/lib/bsd-cache';
import { dashboardParamsSchema } from '@/lib/schemas';

const BSD_TOKEN = process.env.BSD_TOKEN || '';
const BASE_URL = 'https://sports.bzzoiro.com/api';
const BASE_URL_V2 = 'https://sports.bzzoiro.com/api/v2';
const TTL = 900; // 15 min

export const maxDuration = 60;

async function fetchBSD(endpoint: string) {
  // Adiciona tz=America/Sao_Paulo para datas em BRT
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${endpoint}${separator}tz=America/Sao_Paulo`;
  return cacheFetch(
    makeBsdCacheKey('v1', endpoint, 'tz=BRT'),
    async () => {
      const res = await fetch(url, {
        headers: { Authorization: `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`BSD HTTP ${res.status}`);
      return res.json();
    },
    TTL
  );
}

async function fetchBSDv2(endpoint: string) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL_V2}${endpoint}${separator}tz=America/Sao_Paulo`;
  return cacheFetch(
    makeBsdCacheKey('v2', endpoint, 'tz=BRT'),
    async () => {
      const res = await fetch(url, {
        headers: { Authorization: `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`BSD v2 HTTP ${res.status}`);
      return res.json();
    },
    TTL
  );
}

// Helper safe para chamadas v2 que podem falhar
async function fetchV2Safe(endpoint: string): Promise<any> {
  try {
    return await fetchBSDv2(endpoint);
  } catch {
    return null;
  }
}

/** Busca médias reais de cartões do árbitro via endpoint /referees/ */
async function buscarMediaCartoesArbitro(nome: string): Promise<{ avg_yellow: number | null; avg_red: number | null }> {
  if (!nome) return { avg_yellow: null, avg_red: null };
  try {
    const data = await cacheFetch(
      makeBsdCacheKey('v1', `/referees/?name=${encodeURIComponent(nome)}`),
      async () => {
        const res = await fetch(`${BASE_URL}/referees/?name=${encodeURIComponent(nome)}&tz=America/Sao_Paulo`, {
          headers: { Authorization: `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`BSD HTTP ${res.status}`);
        return res.json();
      },
      TTL
    );
    const arbitros = data.results || [];
    if (!arbitros.length) return { avg_yellow: null, avg_red: null };
    // Pega o árbitro com mais jogos (mais relevante)
    const arbitro = arbitros.reduce((a: any, b: any) => (a.matches || 0) > (b.matches || 0) ? a : b);
    return {
      avg_yellow: arbitro.avg_yellow_per_match ?? null,
      avg_red: arbitro.avg_red_per_match ?? null,
    };
  } catch {
    return { avg_yellow: null, avg_red: null };
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId: raw } = await params;
    const parsed = dashboardParamsSchema.safeParse({ eventId: raw });
    if (!parsed.success) {
      return Response.json({ error: 'eventId inválido', details: parsed.error.issues }, { status: 400 });
    }
    const id = parsed.data.eventId;

    // Busca dados do jogo (v1) + odds comparadas em paralelo
    const [jogoData, oddsData, predicaoV2, playerStats, metadata, broadcasts, polymarketData] = await Promise.all([
      fetchBSD(`/events/${id}/`),
      fetchBSD(`/odds/compare/?event=${id}`).catch(() => null),
      fetchV2Safe(`/events/${id}/prediction/`),
      fetchV2Safe(`/events/${id}/player-stats/`),
      fetchV2Safe(`/events/${id}/metadata/`),
      fetchV2Safe(`/events/${id}/broadcasts/`),
      fetchBSD(`/odds/polymarket/?event=${id}`).catch(() => null),
    ]);

    if (!jogoData || jogoData.error) {
      return Response.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Busca classificação (pode falhar)
    const standingsData = jogoData.league?.id
      ? await fetchBSD(`/leagues/${jogoData.league.id}/standings/`).catch(() => null)
      : null;

    // Extrai dados do jogo
    let homeForm = { ...(jogoData.home_form || {}) };
    let awayForm = { ...(jogoData.away_form || {}) };

    // Pipeline v2: tenta enriquecer com histórico ampliado (~15 jogos)
    // v1 retorna ID em home_team_obj.id, não em home_team_id
    const homeTeamId = jogoData.home_team_obj?.id || jogoData.home_team_id;
    const awayTeamId = jogoData.away_team_obj?.id || jogoData.away_team_id;

    if (homeTeamId || awayTeamId) {
      const [v2Home, v2Away] = await Promise.all([
        homeTeamId ? buscarHistoricoTime(homeTeamId, jogoData.home_team) : null,
        awayTeamId ? buscarHistoricoTime(awayTeamId, jogoData.away_team) : null,
      ]);

      if (v2Home) {
        const enriched = formatarComoFormData(v2Home);
        homeForm = { ...homeForm, ...enriched, matches_played: v2Home.total_jogos };
      }
      if (v2Away) {
        const enriched = formatarComoFormData(v2Away);
        awayForm = { ...awayForm, ...enriched, matches_played: v2Away.total_jogos };
      }
    }

    // Últimos 10 jogos de cada time
    const [ultimosCasa, ultimosFora] = await Promise.all([
      homeTeamId ? buscarUltimosJogos(homeTeamId, 10) : Promise.resolve([]),
      awayTeamId ? buscarUltimosJogos(awayTeamId, 10) : Promise.resolve([]),
    ]);

    const referee = jogoData.referee || {};
    const h2h = jogoData.head_to_head || {};

    // unavailable_players: v1 pode retornar {home: [...], away: [...]} ou {home_team: [...], away_team: [...]}
    const unavailable = jogoData.unavailable_players || {};
    const desfalques_casa_raw = unavailable.home || unavailable.home_team || unavailable.homeTeam || [];
    const desfalques_fora_raw = unavailable.away || unavailable.away_team || unavailable.awayTeam || [];

    // home_coach / away_coach: v1 pode retornar _obj ou objeto direto
    const homeCoach = jogoData.home_coach || jogoData.home_coach_obj || {};
    const awayCoach = jogoData.away_coach || jogoData.away_coach_obj || {}

    // Busca média real de cartões do árbitro (yellowCards/redCards são totais, não médias)
    const mediasArbitro = await buscarMediaCartoesArbitro(referee.name);
    const statsPartida = jogoData.stats || {}; // { home: {...}, away: {...} }
    const incidents = jogoData.incidents || [];
    const lineups = jogoData.lineups || null;

    // ── NOVOS ENDPOINTS INTEGRADOS ──

    // Elenco completo (v2 /teams/{id}/squad/)
    const [elencoCasa, elencoFora] = await Promise.all([
      homeTeamId ? fetchV2Safe(`/teams/${homeTeamId}/squad/`) : null,
      awayTeamId ? fetchV2Safe(`/teams/${awayTeamId}/squad/`) : null,
    ]);

    // Perfil técnico completo (v1 /managers/)
    const [tecnicoCasaFull, tecnicoForaFull] = await Promise.all([
      homeTeamId ? fetchBSD(`/managers/?team_id=${homeTeamId}`).catch(() => null) : null,
      awayTeamId ? fetchBSD(`/managers/?team_id=${awayTeamId}`).catch(() => null) : null,
    ]);

    // Jogadores com status de disponibilidade (v1 /players/)
    const [jogadoresCasa, jogadoresFora] = await Promise.all([
      homeTeamId ? fetchBSD(`/players/?team=${homeTeamId}`).catch(() => null) : null,
      awayTeamId ? fetchBSD(`/players/?team=${awayTeamId}`).catch(() => null) : null,
    ]);

    // Calcula odds justas (com nomes dos times)
    const cardsMercado = gerarCardsMercado(
      homeForm, awayForm, jogoData,
      jogoData.home_team, jogoData.away_team
    );

    // Extrai odds do mercado para comparação
    const oddsMercado: Record<string, any> = {};
    if (oddsData?.markets) {
      for (const [mercado, outcomes] of Object.entries(oddsData.markets as Record<string, any>)) {
        oddsMercado[mercado] = {};
        for (const [outcome, data] of Object.entries(outcomes)) {
          oddsMercado[mercado][outcome] = {
            melhor_odd: (data as any).best_odds,
            melhor_casa: (data as any).best_bookmaker,
            pinnacle_odd: (data as any).bookmakers?.Pinnacle?.decimal,
          };
        }
      }
    }

    // Processa tabela
    const tabela = standingsData?.standings
      ? standingsData.standings.map((row: any) => ({
          posicao: row.position,
          time: row.team,
          time_id: row.team_id,
          jogos: row.played,
          vitorias: row.won,
          empates: row.drawn,
          derrotas: row.lost,
          gols_pro: row.gf,
          gols_contra: row.ga,
          saldo_gols: row.gd,
          pontos: row.pts,
          xg_favor: row.xgf,
          xg_contra: row.xga,
          forma_recente: row.form,
        }))
      : null;

    // ── NOVOS DADOS v1 extraídos ──

    // Stats avançadas da partida (posse, passes, dribles, etc.)
    const stats_avancadas = statsPartida.home && statsPartida.away ? {
      home: statsPartida.home,
      away: statsPartida.away,
    } : null;

    // Shotmap (cada chute com xG e coordenadas)
    const shotmap = jogoData.shotmap || null;

    // Momentum (pressão por minuto)
    const momentum = jogoData.momentum || null;

    // xG por minuto
    const xg_por_minuto = jogoData.xg_per_minute || null;

    // Average positions
    const average_positions = jogoData.average_positions || null;

    // ── DADOS v2 ──

    // Predição ML v2
    const predicao = predicaoV2 && !predicaoV2.detail ? {
      modelo: predicaoV2.model?.version,
      confianca: predicaoV2.model?.confidence,
      probabilidades: predicaoV2.markets?.match_result,
      gols_esperados: predicaoV2.markets?.expected_goals ? {
        casa: predicaoV2.markets.expected_goals.home,
        fora: predicaoV2.markets.expected_goals.away,
      } : null,
      over_under: predicaoV2.markets?.over_under,
      btts_sim_pct: predicaoV2.markets?.btts?.prob_yes,
      placar_provavel: predicaoV2.markets?.score?.most_likely,
      recomendacoes: predicaoV2.recommendations,
    } : null;

    // Player stats (rating por jogador) — com nomes dos lineups
    // Cria mapa de nomes a partir dos dados de lineups (v1 ou v2)
    const nomesPorId = new Map<number, string>();
    const lineupData = jogoData.lineups || lineups;
    // Titulares
    for (const side of ['home', 'away']) {
      if (lineupData?.[side]?.players) {
        for (const p of lineupData[side].players) {
          if (p.player_id && p.name) nomesPorId.set(p.player_id, p.name);
        }
      }
      // Substitutos (reservas)
      if (lineupData?.[side]?.substitutes) {
        for (const p of lineupData[side].substitutes) {
          if (p.player_id && p.name) nomesPorId.set(p.player_id, p.name);
        }
      }
    }
    if (lineups?.lineups?.home?.players) {
      for (const p of lineups.lineups.home.players) {
        if (p.id && p.name) nomesPorId.set(p.id, p.name);
      }
    }
    if (lineups?.lineups?.away?.players) {
      for (const p of lineups.lineups.away.players) {
        if (p.id && p.name) nomesPorId.set(p.id, p.name);
      }
    }
    // Player stats (rating por jogador)
    const player_stats = playerStats?.player_stats
      ? playerStats.player_stats.map((s: any) => ({
          jogador_id: s.player_id,
          time_id: s.team_id,
          nome: s.player?.name || nomesPorId.get(s.player_id) || null,
          posicao: s.player?.position || null,
          minutos: s.minutes_played,
          rating: s.rating,
          gols: s.goals,
          assistencias: s.goal_assist,
          xg: s.expected_goals,
          xa: s.expected_assists,
          chutes_total: s.total_shots,
          chutes_no_gol: s.shots_on_target,
          passes_total: s.total_pass,
          passes_certos: s.accurate_pass,
          passes_chave: s.key_pass,
          desarmes: s.total_tackle,
          interceptacoes: s.interception,
          cartao_amarelo: s.yellow_card,
          cartao_vermelho: s.red_card,
          defesas: s.saves,
        }))
      : null;

    // Metadata (fun facts, AI preview)
    const metadados = {
      fatos_curiosos: metadata?.funfacts?.map((f: any) => f.sentence ? traduzirFato(f.sentence) : null) || null,
      preview_ia: metadata?.ai_preview?.text || null,
    };

    // Transmissões TV
    const transmissoes = broadcasts?.results?.length
      ? broadcasts.results.map((b: any) => ({
          pais: b.country_code,
          canal: b.channel_name,
          inicio: b.scheduled_start_time,
        }))
      : null;

    const resultado = {
      jogo: {
        event_id: jogoData.id,
        data: jogoData.event_date,
        liga: jogoData.league?.name,
        pais: jogoData.league?.country,
        liga_id: jogoData.league?.id,
        rodada: jogoData.round_number,
        time_casa: jogoData.home_team,
        time_fora: jogoData.away_team,
        time_casa_id: jogoData.home_team_obj?.id || jogoData.home_team_id,
        time_fora_id: jogoData.away_team_obj?.id || jogoData.away_team_id,
        status: jogoData.status,
      },
      odds_consenso: {
        vitoria_casa: jogoData.odds_home,
        empate: jogoData.odds_draw,
        vitoria_fora: jogoData.odds_away,
        over_15: jogoData.odds_over_15,
        over_25: jogoData.odds_over_25,
        over_35: jogoData.odds_over_35,
        under_15: jogoData.odds_under_15,
        under_25: jogoData.odds_under_25,
        under_35: jogoData.odds_under_35,
        btts_sim: jogoData.odds_btts_yes,
        btts_nao: jogoData.odds_btts_no,
      },
      odds_mercado: oddsMercado,
      cards_mercado: cardsMercado,
      forma_casa: {
        ultimos_jogos: homeForm.form_string,
        ppg_casa: homeForm.home_ppg,
        gols_marcados_casa: homeForm.home_goals_scored,
        gols_sofridos_casa: homeForm.home_goals_conceded,
        gols_marcados_fora: homeForm.away_goals_scored,
        gols_sofridos_fora: homeForm.away_goals_conceded,
        clean_sheets: homeForm.clean_sheets,
        avg_shots: homeForm.avg_shots,
        avg_shots_on_target: homeForm.avg_shots_on_target,
        avg_fouls: homeForm.avg_fouls,
        avg_yellow_cards: homeForm.avg_yellow_cards,
        avg_red_cards: homeForm.avg_red_cards,
        avg_xg: homeForm.avg_xg,
        avg_xg_conceded: homeForm.avg_xg_conceded,
        avg_key_passes: homeForm.avg_key_passes,
        avg_team_rating: homeForm.avg_team_rating,
        vitorias: homeForm.wins,
        empates: homeForm.draws,
        derrotas: homeForm.losses,
      },
      forma_fora: {
        ultimos_jogos: awayForm.form_string,
        ppg_fora: awayForm.away_ppg,
        gols_marcados_casa: awayForm.home_goals_scored,
        gols_sofridos_casa: awayForm.home_goals_conceded,
        gols_marcados_fora: awayForm.away_goals_scored,
        gols_sofridos_fora: awayForm.away_goals_conceded,
        clean_sheets: awayForm.clean_sheets,
        avg_shots: awayForm.avg_shots,
        avg_shots_on_target: awayForm.avg_shots_on_target,
        avg_fouls: awayForm.avg_fouls,
        avg_yellow_cards: awayForm.avg_yellow_cards,
        avg_red_cards: awayForm.avg_red_cards,
        avg_xg: awayForm.avg_xg,
        avg_xg_conceded: awayForm.avg_xg_conceded,
        avg_key_passes: awayForm.avg_key_passes,
        avg_team_rating: awayForm.avg_team_rating,
        vitorias: awayForm.wins,
        empates: awayForm.draws,
        derrotas: awayForm.losses,
      },
      h2h: {
        total_jogos: h2h.total_matches,
        vitorias_casa: h2h.home_wins,
        empates: h2h.draws,
        vitorias_fora: h2h.away_wins,
        gols_casa_total: h2h.home_goals,
        gols_fora_total: h2h.away_goals,
        media_gols: h2h.avg_total_goals != null ? Math.round(h2h.avg_total_goals * 100) / 100 : null,
        ultimos_jogos: (h2h.recent_matches || []).slice(0, 10).map((m: any) => ({
          home_team: m.home || m.home_team,
          away_team: m.away || m.away_team,
          home_score: m.home_score ?? (m.score ? parseInt(String(m.score).split('-')[0]) : null),
          away_score: m.away_score ?? (m.score ? parseInt(String(m.score).split('-')[1]) : null),
          event_date: m.date || m.event_date,
        })),
      },
      arbitro: {
        nome: referee.name,
        amarelos_jogo: mediasArbitro.avg_yellow ?? referee.yellowCards,
        vermelhos_jogo: mediasArbitro.avg_red ?? referee.redCards,
      },
      desfalques_casa: desfalques_casa_raw.map((j: any) => j.name || j),
      desfalques_fora: desfalques_fora_raw.map((j: any) => j.name || j),
      tecnico_casa: homeCoach?.name ? {
        nome: homeCoach.name,
        formacao_preferida: homeCoach.preferred_formation,
        intensidade_pressao: homeCoach.pressing_intensity,
        linha_defensiva: homeCoach.defensive_line,
        estilos_principais: homeCoach.top_styles || [],
      } : null,
      tecnico_fora: awayCoach?.name ? {
        nome: awayCoach.name,
        formacao_preferida: awayCoach.preferred_formation,
        intensidade_pressao: awayCoach.pressing_intensity,
        linha_defensiva: awayCoach.defensive_line,
        estilos_principais: awayCoach.top_styles || [],
      } : null,
      tabela,
      xg_pos_jogo: {
        xg_casa: jogoData.actual_home_xg,
        xg_fora: jogoData.actual_away_xg,
      },
      // ── NOVOS CAMPOS ──
      stats_avancadas,
      incidents,
      shotmap,
      momentum,
      xg_por_minuto,
      average_positions,
      lineups,
      predicao,
      player_stats,
      metadados,
      transmissoes,
      // ── CAMPOS NOVOS (v1 não extraídos antes) ──
      placar: {
        casa: jogoData.home_score ?? null,
        fora: jogoData.away_score ?? null,
        casa_ht: jogoData.home_score_ht ?? null,
        fora_ht: jogoData.away_score_ht ?? null,
      },
      periodo: {
        atual: jogoData.period ?? null,
        minuto: jogoData.current_minute ?? null,
      },
      xg_ao_vivo: {
        casa: jogoData.home_xg_live ?? null,
        fora: jogoData.away_xg_live ?? null,
      },
      contexto: {
        classico_local: jogoData.is_local_derby ?? false,
        distancia_km: jogoData.travel_distance_km ?? null,
        campo_neutro: jogoData.is_neutral_ground ?? null,
      },
      estadio: jogoData.venue ? {
        id: jogoData.venue.id,
        nome: jogoData.venue.name,
        cidade: jogoData.venue.city,
        pais: jogoData.venue.country,
        capacidade: jogoData.venue.capacity ?? null,
      } : null,
      clima: jogoData.weather ? {
        codigo: jogoData.weather.code,
        descricao: jogoData.weather.description,
        vento_kmh: jogoData.weather.wind_speed ?? null,
        temperatura_c: jogoData.weather.temperature_c ?? null,
      } : null,
      gramado: jogoData.pitch_condition ?? null,
      uniformes: jogoData.jerseys ?? null,
      // Últimos 10 jogos de cada time
      ultimos_jogos_casa: ultimosCasa.map((f: any) => ({
        data: f.event_date?.split('T')[0] || '',
        casa: f.home_team,
        fora: f.away_team,
        gols_casa: f.home_score ?? null,
        gols_fora: f.away_score ?? null,
        status: f.status,
      })),
      ultimos_jogos_fora: ultimosFora.map((f: any) => ({
        data: f.event_date?.split('T')[0] || '',
        casa: f.home_team,
        fora: f.away_team,
        gols_casa: f.home_score ?? null,
        gols_fora: f.away_score ?? null,
        status: f.status,
      })),
      // ── ENDPOINTS INTEGRADOS ──
      polymarket: polymarketData?.results?.[0] ? {
        odds: polymarketData.results[0].odds || null,
        placares_exatos: polymarketData.results[0].exact_scores
          ? Object.entries(polymarketData.results[0].exact_scores as Record<string, number>)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([placar, prob]) => ({ placar, prob_pct: Math.round(prob * 1000) / 10 }))
          : null,
        artilheiros: polymarketData.results[0].goalscorers
          ? Object.entries(polymarketData.results[0].goalscorers as Record<string, number>)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([jogador, prob]) => ({ jogador, prob_pct: Math.round(prob * 1000) / 10 }))
          : null,
        atualizado_em: polymarketData.results[0].updated_at || null,
      } : null,
      elenco_casa: elencoCasa?.players ? {
        total: elencoCasa.count || elencoCasa.players.length,
        jogadores: elencoCasa.players.map((p: any) => ({
          id: p.id,
          nome: p.name,
          posicao: p.position,
          numero: p.jersey_number,
          nacionalidade: p.nationality,
          data_nascimento: p.date_of_birth,
        })),
      } : null,
      elenco_fora: elencoFora?.players ? {
        total: elencoFora.count || elencoFora.players.length,
        jogadores: elencoFora.players.map((p: any) => ({
          id: p.id,
          nome: p.name,
          posicao: p.position,
          numero: p.jersey_number,
          nacionalidade: p.nationality,
          data_nascimento: p.date_of_birth,
        })),
      } : null,
      tecnico_casa_completo: tecnicoCasaFull?.results?.[0] ? {
        nome: tecnicoCasaFull.results[0].name,
        pais: tecnicoCasaFull.results[0].country,
        time_atual: tecnicoCasaFull.results[0].current_team?.name || null,
        perfil_geral: tecnicoCasaFull.results[0].profile || null,
        estilo_time: tecnicoCasaFull.results[0].team_style || null,
        formacoes_usadas: tecnicoCasaFull.results[0].formations_used || [],
        estatisticas: {
          jogos_total: tecnicoCasaFull.results[0].matches_total,
          vitorias: tecnicoCasaFull.results[0].wins,
          empates: tecnicoCasaFull.results[0].draws,
          derrotas: tecnicoCasaFull.results[0].losses,
          pct_vitorias: tecnicoCasaFull.results[0].win_pct,
          media_gols_marcados: tecnicoCasaFull.results[0].avg_goals_scored,
          media_gols_sofridos: tecnicoCasaFull.results[0].avg_goals_conceded,
          media_gols_marcados_1t: tecnicoCasaFull.results[0].avg_goals_scored_1h,
          media_gols_sofridos_1t: tecnicoCasaFull.results[0].avg_goals_conceded_1h,
          media_posse: tecnicoCasaFull.results[0].avg_possession,
          media_chutes: tecnicoCasaFull.results[0].avg_shots,
          media_chutes_gol: tecnicoCasaFull.results[0].avg_shots_on_target,
          media_xg_favor: tecnicoCasaFull.results[0].avg_xg_for,
          media_xg_contra: tecnicoCasaFull.results[0].avg_xg_against,
          media_escanteios: tecnicoCasaFull.results[0].avg_corners,
          media_amarelos: tecnicoCasaFull.results[0].avg_yellow_cards,
          media_vermelhos: tecnicoCasaFull.results[0].avg_red_cards,
          media_faltas: tecnicoCasaFull.results[0].avg_fouls,
          pct_clean_sheet: tecnicoCasaFull.results[0].clean_sheet_pct,
          pct_btts: tecnicoCasaFull.results[0].btts_pct,
          pct_over_25: tecnicoCasaFull.results[0].over_25_pct,
          pct_falha_marcar: tecnicoCasaFull.results[0].fail_to_score_pct,
        },
      } : null,
      tecnico_fora_completo: tecnicoForaFull?.results?.[0] ? {
        nome: tecnicoForaFull.results[0].name,
        pais: tecnicoForaFull.results[0].country,
        time_atual: tecnicoForaFull.results[0].current_team?.name || null,
        perfil_geral: tecnicoForaFull.results[0].profile || null,
        estilo_time: tecnicoForaFull.results[0].team_style || null,
        formacoes_usadas: tecnicoForaFull.results[0].formations_used || [],
        estatisticas: {
          jogos_total: tecnicoForaFull.results[0].matches_total,
          vitorias: tecnicoForaFull.results[0].wins,
          empates: tecnicoForaFull.results[0].draws,
          derrotas: tecnicoForaFull.results[0].losses,
          pct_vitorias: tecnicoForaFull.results[0].win_pct,
          media_gols_marcados: tecnicoForaFull.results[0].avg_goals_scored,
          media_gols_sofridos: tecnicoForaFull.results[0].avg_goals_conceded,
          media_gols_marcados_1t: tecnicoForaFull.results[0].avg_goals_scored_1h,
          media_gols_sofridos_1t: tecnicoForaFull.results[0].avg_goals_conceded_1h,
          media_posse: tecnicoForaFull.results[0].avg_possession,
          media_chutes: tecnicoForaFull.results[0].avg_shots,
          media_chutes_gol: tecnicoForaFull.results[0].avg_shots_on_target,
          media_xg_favor: tecnicoForaFull.results[0].avg_xg_for,
          media_xg_contra: tecnicoForaFull.results[0].avg_xg_against,
          media_escanteios: tecnicoForaFull.results[0].avg_corners,
          media_amarelos: tecnicoForaFull.results[0].avg_yellow_cards,
          media_vermelhos: tecnicoForaFull.results[0].avg_red_cards,
          media_faltas: tecnicoForaFull.results[0].avg_fouls,
          pct_clean_sheet: tecnicoForaFull.results[0].clean_sheet_pct,
          pct_btts: tecnicoForaFull.results[0].btts_pct,
          pct_over_25: tecnicoForaFull.results[0].over_25_pct,
          pct_falha_marcar: tecnicoForaFull.results[0].fail_to_score_pct,
        },
      } : null,
      jogadores_casa: jogadoresCasa?.results?.length ? {
        total: jogadoresCasa.results.length,
        jogadores: jogadoresCasa.results.map((p: any) => ({
          id: p.id,
          nome: p.name,
          posicao: p.position,
          numero: p.jersey_number,
          disponibilidade: p.availability,
          tipo_lesao: p.injury_type || null,
          retorno_previsto: p.injury_expected_return || null,
          pe_preferido: p.preferred_foot,
          valor_mercado_eur: p.market_value || null,
        })),
      } : null,
      jogadores_fora: jogadoresFora?.results?.length ? {
        total: jogadoresFora.results.length,
        jogadores: jogadoresFora.results.map((p: any) => ({
          id: p.id,
          nome: p.name,
          posicao: p.position,
          numero: p.jersey_number,
          disponibilidade: p.availability,
          tipo_lesao: p.injury_type || null,
          retorno_previsto: p.injury_expected_return || null,
          pe_preferido: p.preferred_foot,
          valor_mercado_eur: p.market_value || null,
        })),
      } : null,
    };

    return Response.json(resultado, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
