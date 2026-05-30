/**
 * BSD API — 11 tools em TypeScript
 * Base URL: https://sports.bzzoiro.com/api
 * Auth: Header Authorization: Token {BSD_TOKEN}
 * Todas as funções retornam JSON string para uso com OpenAI function calling
 */

const BASE_URL = 'https://sports.bzzoiro.com/api';
const TZ = 'America/Sao_Paulo';

function getHeaders(): HeadersInit {
  return {
    Authorization: `Token ${process.env.BSD_TOKEN || ''}`,
    'Content-Type': 'application/json',
  };
}

async function _get(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<any> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('tz', TZ);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  try {
    const res = await fetch(url.toString(), { headers: getHeaders(), signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error: any) {
    return { error: error.message || 'Erro na requisição BSD' };
  }
}

function formatForm(formData: any): Record<string, any> {
  if (!formData) return {};
  return {
    ultimos_jogos: formData.form_string || 'N/A',
    vitorias: formData.wins,
    empates: formData.draws,
    derrotas: formData.losses,
    gols_marcados_recentes: formData.goals_scored_last_n,
    gols_sofridos_recentes: formData.goals_conceded_last_n,
    xg_medio_marcado: formData.avg_xg,
    xg_medio_sofrido: formData.avg_xg_conceded,
    chutes_por_jogo: formData.avg_shots,
    chutes_no_gol_por_jogo: formData.avg_shots_on_target,
    passes_chave_por_jogo: formData.avg_key_passes,
    clean_sheets: formData.clean_sheets,
    ppg_em_casa: formData.home_ppg,
    ppg_fora: formData.away_ppg,
    gols_em_casa: formData.home_goals_scored,
    gols_sofridos_em_casa: formData.home_goals_conceded,
    gols_fora: formData.away_goals_scored,
    gols_sofridos_fora: formData.away_goals_conceded,
    faltas_por_jogo: formData.avg_fouls,
    cartoes_amarelos_por_jogo: formData.avg_yellow_cards,
    rating_medio_time: formData.avg_team_rating,
  };
}

// ── TOOL 1 ──
export async function buscar_jogo(params: { time_casa?: string; time_fora?: string; data?: string; event_id?: number }): Promise<string> {
  if (params.event_id) {
    const data = await _get(`/events/${params.event_id}/`);
    return JSON.stringify(data, null, 2);
  }

  const hoje = new Date().toISOString().split('T')[0];
  const semana = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const queryParams: Record<string, string | number | boolean> = {};
  if (params.time_casa) queryParams.team = params.time_casa;
  queryParams.date_from = params.data || hoje;
  queryParams.date_to = params.data || semana;

  const result = await _get('/events/', queryParams);

  let jogos: any[] = result.results || [];
  if (params.time_fora) {
    const tf = params.time_fora.toLowerCase();
    jogos = jogos.filter((ev: any) =>
      (ev.away_team || '').toLowerCase().includes(tf) ||
      (ev.home_team || '').toLowerCase().includes(tf)
    );
  }

  const jogosResumidos = jogos.map((ev: any) => ({
    event_id: ev.id,
    data: ev.event_date,
    liga: ev.league?.name,
    time_casa: ev.home_team,
    time_fora: ev.away_team,
    status: ev.status,
    odd_casa: ev.odds_home,
    odd_empate: ev.odds_draw,
    odd_fora: ev.odds_away,
    odd_over25: ev.odds_over_25,
    odd_btts_sim: ev.odds_btts_yes,
  }));

  return JSON.stringify({ total_encontrado: jogos.length, jogos: jogosResumidos }, null, 2);
}

// ── TOOL 2 ──
export async function analisar_jogo(params: { event_id: number }): Promise<string> {
  const data = await _get(`/events/${params.event_id}/`);
  if (data.error) return JSON.stringify(data);

  const homeForm = formatForm(data.home_form);
  const awayForm = formatForm(data.away_form);
  const unavailable = data.unavailable_players || {};
  const referee = data.referee || {};
  const homeCoach = data.home_coach || {};
  const awayCoach = data.away_coach || {};
  const h2h = data.head_to_head || {};

  const resultado = {
    jogo: {
      event_id: data.id,
      data: data.event_date,
      liga: data.league?.name,
      pais: data.league?.country,
      rodada: data.round_number,
      time_casa: data.home_team,
      time_fora: data.away_team,
      status: data.status,
    },
    odds_consenso: {
      vitoria_casa: data.odds_home,
      empate: data.odds_draw,
      vitoria_fora: data.odds_away,
      over_15: data.odds_over_15,
      over_25: data.odds_over_25,
      over_35: data.odds_over_35,
      under_15: data.odds_under_15,
      under_25: data.odds_under_25,
      under_35: data.odds_under_35,
      btts_sim: data.odds_btts_yes,
      btts_nao: data.odds_btts_no,
    },
    xg_pos_jogo: {
      xg_casa: data.actual_home_xg,
      xg_fora: data.actual_away_xg,
    },
    time_casa_forma: homeForm,
    time_fora_forma: awayForm,
    tecnico_casa: {
      nome: homeCoach.name,
      formacao_preferida: homeCoach.preferred_formation,
      intensidade_pressao: homeCoach.pressing_intensity,
      linha_defensiva: homeCoach.defensive_line,
      estilos_taticos: homeCoach.top_styles || [],
    },
    tecnico_fora: {
      nome: awayCoach.name,
      formacao_preferida: awayCoach.preferred_formation,
      intensidade_pressao: awayCoach.pressing_intensity,
      linha_defensiva: awayCoach.defensive_line,
      estilos_taticos: awayCoach.top_styles || [],
    },
    desfalques_casa: unavailable.home || [],
    desfalques_fora: unavailable.away || [],
    arbitro: {
      nome: referee.name,
      cartoes_amarelos_jogo: referee.yellowCards,
      cartoes_vermelhos_jogo: referee.redCards,
    },
    h2h: {
      total_jogos: h2h.total_matches,
      vitorias_casa: h2h.home_wins,
      empates: h2h.draws,
      vitorias_fora: h2h.away_wins,
      gols_casa_total: h2h.home_goals,
      gols_fora_total: h2h.away_goals,
      media_gols_jogo: h2h.avg_total_goals,
      taxa_vitoria_casa: h2h.home_win_rate,
      taxa_vitoria_fora: h2h.away_win_rate,
      ultimos_jogos: (h2h.recent_matches || []).slice(0, 10),
    },
  };

  return JSON.stringify(resultado, null, 2);
}

// ── TOOL 3 ──
export async function buscar_predicoes_ml(params: { event_id: number }): Promise<string> {
  for (const upcoming of ['false', 'true']) {
    const data = await _get('/predictions/', { upcoming });
    if (data.error) return JSON.stringify(data);

    const predicao = (data.results || []).find((item: any) => item.event?.id === params.event_id);
    if (predicao) {
      return JSON.stringify({
        model_version: predicao.model_version,
        confianca_modelo: predicao.confidence,
        probabilidades_1x2: {
          vitoria_casa_pct: predicao.prob_home_win,
          empate_pct: predicao.prob_draw,
          vitoria_fora_pct: predicao.prob_away_win,
        },
        resultado_previsto: predicao.predicted_result,
        placar_mais_provavel: predicao.most_likely_score,
        favorito: predicao.favorite,
        prob_favorito_pct: predicao.favorite_prob,
        gols_esperados: {
          xg_casa: predicao.expected_home_goals,
          xg_fora: predicao.expected_away_goals,
          total_xg: Math.round(((predicao.expected_home_goals || 0) + (predicao.expected_away_goals || 0)) * 100) / 100,
        },
        mercados_probabilidade: {
          over_15_pct: predicao.prob_over_15,
          over_25_pct: predicao.prob_over_25,
          over_35_pct: predicao.prob_over_35,
          btts_sim_pct: predicao.prob_btts_yes,
        },
        recomendacoes_modelo: {
          apostar_favorito: predicao.favorite_recommend,
          apostar_over_15: predicao.over_15_recommend,
          apostar_over_25: predicao.over_25_recommend,
          apostar_over_35: predicao.over_35_recommend,
          apostar_btts: predicao.btts_recommend,
          apostar_tem_vencedor: predicao.winner_recommend,
        },
      }, null, 2);
    }
  }

  return JSON.stringify({ aviso: 'Predição ML não encontrada para este event_id.' }, null, 2);
}

// ── TOOL 4 ──
export async function comparar_odds(params: { event_id: number }): Promise<string> {
  const data = await _get('/odds/compare/', { event: params.event_id });
  if (data.error) return JSON.stringify(data);

  const resultado: Record<string, any> = {
    casas_disponiveis: data.bookmakers_count,
    mercados: {},
  };

  for (const [mercado, outcomes] of Object.entries(data.markets || {})) {
    resultado.mercados[mercado] = {};
    for (const [outcomeName, outcomeData] of Object.entries(outcomes as Record<string, any>)) {
      const bookmakers = outcomeData.bookmakers || {};
      const pinnacleOdd = bookmakers.Pinnacle?.decimal;
      resultado.mercados[mercado][outcomeName] = {
        melhor_odd: outcomeData.best_odds,
        melhor_casa: outcomeData.best_bookmaker,
        pinnacle_odd: pinnacleOdd,
        pinnacle_prob_implicita: pinnacleOdd ? Math.round((1 / pinnacleOdd) * 10000) / 10000 : null,
      };
    }
  }

  return JSON.stringify(resultado, null, 2);
}

// ── TOOL 5 ──
export async function buscar_polymarket(params: { event_id: number }): Promise<string> {
  const data = await _get('/odds/polymarket/', { event: params.event_id });
  if (data.error) return JSON.stringify(data);

  const results = data.results || [];
  if (!results.length) {
    return JSON.stringify({ aviso: 'Sem dados Polymarket para este jogo.' }, null, 2);
  }

  const item = results[0];
  const exactScores = item.exact_scores || {};
  const goalscorers = item.goalscorers || {};

  const topPlacares = Object.entries(exactScores)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 10)
    .map(([placar, prob]: [string, any]) => ({ placar, probabilidade_pct: Math.round(prob * 1000) / 10 }));

  const topArtilheiros = Object.entries(goalscorers)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 10)
    .map(([jogador, prob]: [string, any]) => ({ jogador, probabilidade_pct: Math.round(prob * 1000) / 10 }));

  return JSON.stringify({
    mercados_principais: item.odds,
    top_placares_mais_provaveis: topPlacares,
    top_artilheiros_provaveis: topArtilheiros,
    atualizado_em: item.updated_at,
  }, null, 2);
}

// ── TOOL 6 ──
export async function buscar_historico_arbitro(params: { nome_arbitro: string; league_id?: number }): Promise<string> {
  const queryParams: Record<string, string | number | boolean> = { name: params.nome_arbitro };
  if (params.league_id) queryParams.league = params.league_id;

  const data = await _get('/referees/', queryParams);
  if (data.error) return JSON.stringify(data);

  const arbitros = data.results || [];
  if (!arbitros.length) {
    return JSON.stringify({ aviso: `Árbitro '${params.nome_arbitro}' não encontrado.` }, null, 2);
  }

  const arbitro = arbitros.reduce((a: any, b: any) => (a.matches || 0) > (b.matches || 0) ? a : b);

  return JSON.stringify({
    nome: arbitro.name,
    pais: arbitro.country,
    jogos_arbitrados: arbitro.matches,
    media_amarelos_por_jogo: arbitro.avg_yellow_per_match,
    media_vermelhos_por_jogo: arbitro.avg_red_per_match,
    media_gols_por_jogo: arbitro.avg_goals_per_match,
    media_faltas_por_jogo: arbitro.avg_fouls_per_match,
    total_amarelos: arbitro.total_yellow_cards,
    total_vermelhos: arbitro.total_red_cards,
    carreira_jogos: arbitro.career_games,
    carreira_amarelos: arbitro.career_yellow_cards,
    carreira_vermelhos: arbitro.career_red_cards,
  }, null, 2);
}

// ── TOOL 7 ──
export async function buscar_perfil_tecnico(params: { team_id?: number; nome_tecnico?: string }): Promise<string> {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params.team_id) queryParams.team_id = params.team_id;
  else if (params.nome_tecnico) queryParams.search = params.nome_tecnico;

  const data = await _get('/managers/', queryParams);
  if (data.error) return JSON.stringify(data);

  const tecnicos = data.results || [];
  if (!tecnicos.length) {
    return JSON.stringify({ aviso: 'Técnico não encontrado.' }, null, 2);
  }

  const t = tecnicos[0];
  return JSON.stringify({
    nome: t.name,
    pais: t.country,
    time_atual: t.current_team?.name || null,
    perfil_geral: t.profile,
    estilo_time: t.team_style,
    formacao_preferida: t.preferred_formation,
    formacoes_usadas: t.formations_used,
    intensidade_pressao_0a1: t.pressing_intensity,
    linha_defensiva: t.defensive_line,
    top_estilos_taticos: t.tactical_styles || [],
    estatisticas: {
      jogos_total: t.matches_total,
      vitorias: t.wins,
      empates: t.draws,
      derrotas: t.losses,
      pct_vitorias: t.win_pct,
      media_gols_marcados: t.avg_goals_scored,
      media_gols_sofridos: t.avg_goals_conceded,
      media_gols_marcados_1t: t.avg_goals_scored_1h,
      media_gols_sofridos_1t: t.avg_goals_conceded_1h,
      media_posse: t.avg_possession,
      media_chutes: t.avg_shots,
      media_chutes_gol: t.avg_shots_on_target,
      media_xg_favor: t.avg_xg_for,
      media_xg_contra: t.avg_xg_against,
      media_escanteios: t.avg_corners,
      media_amarelos: t.avg_yellow_cards,
      media_vermelhos: t.avg_red_cards,
      media_faltas: t.avg_fouls,
      pct_clean_sheet: t.clean_sheet_pct,
      pct_btts: t.btts_pct,
      pct_over_25: t.over_25_pct,
      pct_over_15: t.over_15_pct,
      pct_falha_marcar: t.fail_to_score_pct,
    },
  }, null, 2);
}

// ── TOOL 8 ──
export async function buscar_tabela(params: { league_id: number; season_id?: number }): Promise<string> {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params.season_id) queryParams.season = params.season_id;

  const data = await _get(`/leagues/${params.league_id}/standings/`, queryParams);
  if (data.error) return JSON.stringify(data);

  const tabela = (data.standings || []).map((row: any) => ({
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
  }));

  return JSON.stringify({
    liga: data.league?.name || null,
    temporada: data.season?.name || null,
    tabela,
  }, null, 2);
}

// ── TOOL 9 ──
export async function buscar_stats_jogadores(params: { team_id?: number; event_id?: number; player_id?: number }): Promise<string> {
  if (!params.team_id && !params.event_id && !params.player_id) {
    return JSON.stringify({ erro: 'Informe ao menos um: team_id, event_id ou player_id' }, null, 2);
  }

  const queryParams: Record<string, string | number | boolean> = {};
  if (params.team_id) queryParams.team = params.team_id;
  if (params.event_id) queryParams.event = params.event_id;
  if (params.player_id) queryParams.player = params.player_id;

  const data = await _get('/player-stats/', queryParams);
  if (data.error) return JSON.stringify(data);

  const stats = (data.results || []).slice(0, 20).map((s: any) => ({
    jogador: s.player?.name,
    jogador_id: s.player?.id,
    posicao: s.player?.position,
    time: s.player?.team,
    jogo: `${s.event?.home_team || ''} ${s.event?.home_score ?? ''}-${s.event?.away_score ?? ''} ${s.event?.away_team || ''}`,
    data_jogo: s.event?.event_date,
    minutos: s.minutes_played,
    rating: s.rating,
    gols: s.goals,
    assistencias: s.goal_assist,
    xg: s.expected_goals,
    xa: s.expected_assists,
    chutes_total: s.total_shots,
    chutes_no_gol: s.shots_on_target,
    passes_chave: s.key_pass,
    cartao_amarelo: s.yellow_card,
    cartao_vermelho: s.red_card,
    faltas_sofridas: s.was_fouled,
    faltas_cometidas: s.fouls,
    duals_ganhos: s.duel_won,
    duelos_perdidos: s.duel_lost,
    saves: s.saves,
  }));

  return JSON.stringify({ total_registros: data.count, stats }, null, 2);
}

// ── TOOL 10 ──
export async function listar_ligas(): Promise<string> {
  const data = await _get('/leagues/');
  if (data.error) return JSON.stringify(data);

  const ligas = (data.results || []).map((league: any) => ({
    league_id: league.id,
    nome: league.name,
    pais: league.country,
    feminino: league.is_women,
    temporada_atual_id: league.current_season?.id || null,
    temporada_atual_nome: league.current_season?.name || null,
  }));

  return JSON.stringify({ total_ligas: data.count, ligas }, null, 2);
}

// ── TOOL 11 ──
export async function buscar_jogadores_time(params: { team_id: number; apenas_indisponiveis?: boolean }): Promise<string> {
  const data = await _get('/players/', { team: params.team_id });
  if (data.error) return JSON.stringify(data);

  let jogadores = data.results || [];

  if (params.apenas_indisponiveis) {
    jogadores = jogadores.filter((j: any) =>
      ['injured', 'doubtful', 'suspended'].includes(j.availability)
    );
  }

  const resultado = jogadores.map((j: any) => ({
    id: j.id,
    nome: j.name,
    posicao: j.position,
    numero: j.jersey_number,
    disponibilidade: j.availability || 'available',
    tipo_lesao: j.injury_type,
    retorno_previsto: j.injury_expected_return,
    pe_preferido: j.preferred_foot,
    valor_mercado_eur: j.market_value,
  }));

  return JSON.stringify({ time_id: params.team_id, total: resultado.length, jogadores: resultado }, null, 2);
}

// ── EXECUTOR CENTRAL ──
type ToolFunction = (params: any) => Promise<string>;

const toolMap: Record<string, ToolFunction> = {
  buscar_jogo,
  analisar_jogo,
  buscar_predicoes_ml,
  comparar_odds,
  buscar_polymarket,
  buscar_historico_arbitro,
  buscar_perfil_tecnico,
  buscar_tabela,
  buscar_stats_jogadores,
  listar_ligas,
  buscar_jogadores_time,
};

export async function executar_function_call(nome: string, argumentos: any): Promise<string> {
  const fn = toolMap[nome];
  if (!fn) return JSON.stringify({ erro: `Função '${nome}' não encontrada.` });
  try {
    return await fn(argumentos || {});
  } catch (error: any) {
    return JSON.stringify({ erro: error.message, funcao: nome, args: argumentos });
  }
}

// ── DECLARAÇÕES OPENAI FUNCTION CALLING ──
export const toolDeclarations = [
  {
    type: 'function',
    function: {
      name: 'buscar_jogo',
      description: 'Busca jogos de futebol na BSD por nome dos times, data ou ID direto. Use primeiro para encontrar o event_id.',
      parameters: {
        type: 'object',
        properties: {
          time_casa: { type: 'string', description: 'Nome do time da casa (parcial)' },
          time_fora: { type: 'string', description: 'Nome do time visitante (parcial)' },
          data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
          event_id: { type: 'number', description: 'ID direto do evento (mais preciso)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analisar_jogo',
      description: 'Análise completa de um jogo: forma recente (W/D/L), médias por jogo (gols, xG, chutes, chutes no gol, faltas, cartões, passes-chave, rating, clean sheets), H2H, árbitro, desfalques, técnicos (formação, pressão, estilo), odds consenso.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'number', description: 'ID do evento' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_predicoes_ml',
      description: 'Predições do modelo CatBoost: probabilidades de resultado, gols esperados, BTTS, over/under.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'number', description: 'ID do evento' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'comparar_odds',
      description: 'Odds lado a lado de Pinnacle, Bet365, Betano, Bwin e mais. Inclui probabilidade implícita da Pinnacle para cálculo de EV.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'number', description: 'ID do evento' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_polymarket',
      description: 'Dados do Polymarket: probabilidades de placar exato, artilheiros. Útil para player props.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'number', description: 'ID do evento' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_historico_arbitro',
      description: 'Histórico do árbitro: média de cartões, faltas e gols por jogo.',
      parameters: {
        type: 'object',
        properties: {
          nome_arbitro: { type: 'string', description: 'Nome do árbitro' },
          league_id: { type: 'number', description: 'ID da liga (opcional)' },
        },
        required: ['nome_arbitro'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_perfil_tecnico',
      description: 'Perfil tático do técnico: formação, pressão, linha defensiva, estilo de jogo.',
      parameters: {
        type: 'object',
        properties: {
          team_id: { type: 'number', description: 'ID do time' },
          nome_tecnico: { type: 'string', description: 'Nome do técnico' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_tabela',
      description: 'Tabela de classificação atual da liga com pontos, saldo de gols, xG e forma recente.',
      parameters: {
        type: 'object',
        properties: {
          league_id: { type: 'number', description: 'ID da liga' },
          season_id: { type: 'number', description: 'ID da temporada (opcional)' },
        },
        required: ['league_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_stats_jogadores',
      description: 'Stats por partida de jogadores: gols, assistências, xG, chutes, cartões.',
      parameters: {
        type: 'object',
        properties: {
          team_id: { type: 'number', description: 'ID do time' },
          event_id: { type: 'number', description: 'ID do evento' },
          player_id: { type: 'number', description: 'ID do jogador' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_ligas',
      description: 'Lista todas as ligas disponíveis com seus IDs.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_jogadores_time',
      description: 'Lista jogadores de um time com status de disponibilidade. Identifica lesionados e suspensos.',
      parameters: {
        type: 'object',
        properties: {
          team_id: { type: 'number', description: 'ID do time' },
          apenas_indisponiveis: { type: 'boolean', description: 'Se true, retorna só lesionados/suspensos' },
        },
        required: ['team_id'],
      },
    },
  },
];
