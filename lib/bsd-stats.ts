/**
 * Pipeline v2 — busca histórico ampliado de estatísticas por time
 * Usa BSD API v2 para buscar 15-20 jogos recentes e calcular médias reais
 */

const BASE_URL_V2 = 'https://sports.bzzoiro.com/api/v2';

interface TeamStatsAverages {
  total_jogos: number;
  home_jogos: number;
  away_jogos: number;
  // Contagem
  avg_gols_feitos: number;
  avg_gols_sofridos: number;
  avg_shots: number;
  avg_shots_on_target: number;
  avg_shots_inside_box: number;
  avg_shots_outside_box: number;
  avg_fouls: number;
  avg_yellow_cards: number;
  avg_red_cards: number;
  avg_corners: number;
  avg_offsides: number;
  avg_tackles: number;
  avg_interceptions: number;
  avg_clearances: number;
  avg_blocked_shots: number;
  avg_crosses: number;
  avg_dribbles: number;
  avg_aerial_duels: number;
  avg_saves: number;
  avg_pass_key: number;
  avg_big_chances: number;
  // Percentual
  avg_possession: number;
  avg_pass_accuracy: number;
  // xG
  avg_xg: number;
  avg_xg_conceded: number;
}

async function fetchToken(): Promise<string> {
  return process.env.BSD_TOKEN || '';
}

async function getV2(endpoint: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL_V2}${endpoint}`, {
    headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Busca as médias históricas de um time usando v2
 */
export async function buscarHistoricoTime(
  teamId: number,
  teamName: string,
  maxJogos: number = 20
): Promise<TeamStatsAverages | null> {
  const token = await fetchToken();
  if (!token || !teamId) return null;

  try {
    // 1. Busca fixtures recentes (últimos 6 meses)
    const hoje = new Date().toISOString().split('T')[0];
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
    const from = seisMesesAtras.toISOString().split('T')[0];

    const fixturesData = await getV2(
      `/teams/${teamId}/fixtures/?date_from=${from}&date_to=${hoje}&status=finished&limit=${maxJogos}`,
      token
    );
    const fixtures = fixturesData.results || [];

    if (fixtures.length === 0) return null;

    // 2. Busca stats de cada jogo em paralelo
    const statsResults = await Promise.allSettled(
      fixtures.map((f: any) => getV2(`/events/${f.id}/stats/`, token))
    );

    // 3. Calcula médias
    const stats: TeamStatsAverages = {
      total_jogos: 0, home_jogos: 0, away_jogos: 0,
      avg_gols_feitos: 0, avg_gols_sofridos: 0,
      avg_shots: 0, avg_shots_on_target: 0,
      avg_shots_inside_box: 0, avg_shots_outside_box: 0,
      avg_fouls: 0, avg_yellow_cards: 0, avg_red_cards: 0,
      avg_corners: 0, avg_offsides: 0,
      avg_tackles: 0, avg_interceptions: 0,
      avg_clearances: 0, avg_blocked_shots: 0,
      avg_crosses: 0, avg_dribbles: 0, avg_aerial_duels: 0,
      avg_saves: 0, avg_pass_key: 0, avg_big_chances: 0,
      avg_possession: 0, avg_pass_accuracy: 0,
      avg_xg: 0, avg_xg_conceded: 0,
    };

    let count = 0;

    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];
      const result = statsResults[i];
      if (result.status !== 'fulfilled' || !result.value.stats) continue;

      const ehCasa = (fixture.home_team || '').toLowerCase() === teamName.toLowerCase();
      const side = ehCasa ? result.value.stats.home : result.value.stats.away;
      const sideOp = ehCasa ? result.value.stats.away : result.value.stats.home;
      if (!side) continue;

      if (ehCasa) stats.home_jogos++;
      else stats.away_jogos++;

      stats.avg_gols_feitos += ehCasa ? (fixture.home_score ?? 0) : (fixture.away_score ?? 0);
      stats.avg_gols_sofridos += ehCasa ? (fixture.away_score ?? 0) : (fixture.home_score ?? 0);
      stats.avg_shots += side.total_shots ?? 0;
      stats.avg_shots_on_target += side.shots_on_target ?? 0;
      stats.avg_shots_inside_box += side.shots_inside_box ?? 0;
      stats.avg_shots_outside_box += side.shots_outside_box ?? 0;
      stats.avg_fouls += side.fouls ?? 0;
      stats.avg_yellow_cards += side.yellow_cards ?? 0;
      stats.avg_red_cards += side.red_cards ?? 0;
      stats.avg_corners += side.corner_kicks ?? 0;
      stats.avg_offsides += side.offsides ?? 0;
      stats.avg_tackles += side.total_tackles ?? side.tackles ?? 0;
      stats.avg_interceptions += side.interceptions ?? 0;
      stats.avg_clearances += side.clearances ?? 0;
      stats.avg_blocked_shots += side.blocked_shots ?? 0;
      stats.avg_crosses += side.crosses?.value ?? (typeof side.crosses === 'number' ? side.crosses : 0);
      stats.avg_dribbles += side.dribbles?.value ?? (typeof side.dribbles === 'number' ? side.dribbles : 0);
      stats.avg_aerial_duels += side.aerial_duels?.value ?? (typeof side.aerial_duels === 'number' ? side.aerial_duels : 0);
      stats.avg_saves += side.total_saves ?? side.saves ?? 0;
      stats.avg_pass_key += side.key_pass ?? 0;
      stats.avg_big_chances += side.big_chances ?? 0;
      stats.avg_possession += side.ball_possession ?? 0;
      stats.avg_pass_accuracy += side.pass_accuracy_pct ?? 0;
      stats.avg_xg += (side.xg?.actual ?? side.xg ?? 0);
      stats.avg_xg_conceded += (sideOp?.xg?.actual ?? sideOp?.xg ?? 0);
      count++;
    }

    if (count === 0) return null;
    stats.total_jogos = count;

    // Divide tudo pelo count
    const keys = Object.keys(stats) as (keyof TeamStatsAverages)[];
    for (const key of keys) {
      if (key === 'total_jogos' || key === 'home_jogos' || key === 'away_jogos') continue;
      (stats as any)[key] = Math.round(((stats as any)[key] / count) * 100) / 100;
    }

    return stats;
  } catch {
    return null;
  }
}

/**
 * Busca últimos N jogos de um time com resultado
 */
export async function buscarUltimosJogos(
  teamId: number,
  limit: number = 10
): Promise<any[]> {
  const token = await fetchToken();
  if (!token || !teamId) return [];

  try {
    const hoje = new Date().toISOString().split('T')[0];
    const r = await fetch(
      `${BASE_URL_V2}/teams/${teamId}/fixtures/?date_to=${hoje}&status=finished&limit=${limit}&sort=desc`,
      { headers: { Authorization: `Token ${token}` }, signal: AbortSignal.timeout(8000) }
    );
    const d = await r.json();
    return (d.results || []).reverse();
  } catch {
    return [];
  }
}

/**
 * Converte TeamStatsAverages para o formato compatível com gerarCardsMercado
 */
export function formatarComoFormData(stats: TeamStatsAverages): Record<string, any> {
  return {
    matches_played: stats.total_jogos,
    form_string: '',
    wins: 0, draws: 0, losses: 0,
    // Gols
    home_goals_scored: Math.round(stats.avg_gols_feitos * stats.home_jogos),
    away_goals_scored: Math.round(stats.avg_gols_feitos * stats.away_jogos),
    home_goals_conceded: Math.round(stats.avg_gols_sofridos * stats.home_jogos),
    away_goals_conceded: Math.round(stats.avg_gols_sofridos * stats.away_jogos),
    // Médias por jogo
    avg_shots: stats.avg_shots,
    avg_shots_on_target: stats.avg_shots_on_target,
    avg_fouls: stats.avg_fouls,
    avg_yellow_cards: stats.avg_yellow_cards,
    avg_xg: stats.avg_xg,
    avg_xg_conceded: stats.avg_xg_conceded,
    // Campos estendidos
    avg_shots_inside_box: stats.avg_shots_inside_box,
    avg_shots_outside_box: stats.avg_shots_outside_box,
    avg_red_cards: stats.avg_red_cards,
    avg_corners: stats.avg_corners,
    avg_offsides: stats.avg_offsides,
    avg_tackles: stats.avg_tackles,
    avg_interceptions: stats.avg_interceptions,
    avg_clearances: stats.avg_clearances,
    avg_blocked_shots: stats.avg_blocked_shots,
    avg_crosses: stats.avg_crosses,
    avg_dribbles: stats.avg_dribbles,
    avg_aerial_duels: stats.avg_aerial_duels,
    avg_saves: stats.avg_saves,
    avg_key_passes: stats.avg_pass_key,
    avg_big_chances: stats.avg_big_chances,
    avg_possession: stats.avg_possession,
    avg_pass_accuracy: stats.avg_pass_accuracy,
  };
}
