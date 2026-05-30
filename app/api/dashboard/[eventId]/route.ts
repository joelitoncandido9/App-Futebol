/**
 * GET /api/dashboard/{eventId}
 * Retorna dados completos do jogo + odds justas calculadas
 * Cache: revalidate 15 minutos
 */

import { gerarCardsMercado } from '@/lib/odds-jtsa';

const BSD_TOKEN = process.env.BSD_TOKEN || '';
const BASE_URL = 'https://sports.bzzoiro.com/api';

export const maxDuration = 30;

async function fetchBSD(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`BSD HTTP ${res.status}`);
  return res.json();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const id = parseInt(eventId);
    if (isNaN(id)) {
      return Response.json({ error: 'eventId inválido' }, { status: 400 });
    }

    // Busca dados do jogo + odds comparadas em paralelo
    const [jogoData, oddsData] = await Promise.all([
      fetchBSD(`/events/${id}/`),
      fetchBSD(`/odds/compare/?event=${id}`).catch(() => null),
    ]);

    if (!jogoData || jogoData.error) {
      return Response.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Busca classificação (pode falhar)
    const standingsData = jogoData.league?.id
      ? await fetchBSD(`/leagues/${jogoData.league.id}/standings/`).catch(() => null)
      : null;

    // Extrai dados do jogo
    const homeForm = jogoData.home_form || {};
    const awayForm = jogoData.away_form || {};
    const referee = jogoData.referee || {};
    const h2h = jogoData.head_to_head || {};
    const unavailable = jogoData.unavailable_players || {};
    const homeCoach = jogoData.home_coach || {};
    const awayCoach = jogoData.away_coach || {};

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
        time_casa_id: jogoData.home_team_id,
        time_fora_id: jogoData.away_team_id,
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
        media_gols: h2h.avg_total_goals,
        ultimos_jogos: (h2h.recent_matches || []).slice(0, 10),
      },
      arbitro: {
        nome: referee.name,
        amarelos_jogo: referee.yellowCards,
        vermelhos_jogo: referee.redCards,
      },
      desfalques_casa: (unavailable.home || []).map((j: any) => j.name || j),
      desfalques_fora: (unavailable.away || []).map((j: any) => j.name || j),
      tecnico_casa: homeCoach?.name ? {
        nome: homeCoach.name,
        formacao_preferida: homeCoach.preferred_formation,
        pressing_intensity: homeCoach.pressing_intensity,
        defensive_line: homeCoach.defensive_line,
        top_styles: homeCoach.top_styles || [],
      } : null,
      tecnico_fora: awayCoach?.name ? {
        nome: awayCoach.name,
        formacao_preferida: awayCoach.preferred_formation,
        pressing_intensity: awayCoach.pressing_intensity,
        defensive_line: awayCoach.defensive_line,
        top_styles: awayCoach.top_styles || [],
      } : null,
      tabela,
      xg_pos_jogo: {
        xg_casa: jogoData.actual_home_xg,
        xg_fora: jogoData.actual_away_xg,
      },
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
