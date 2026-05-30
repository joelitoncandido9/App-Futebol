/**
 * Dixon-Coles em TypeScript
 * Modelo de predição 1X2 baseado em forças de ataque/defesa por liga
 * Parâmetros extraídos do Football AI v2 (treinados com 25 temporadas)
 */

import dcParams from '@/ml/params/dixon_coles_params.json';

interface TeamStrength {
  attack: number;
  defense: number;
}

interface MatchPrediction {
  homeProb: number;
  drawProb: number;
  awayProb: number;
  homeOJ: number;
  drawOJ: number;
  awayOJ: number;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function poissonProb(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function getLeagueParams(leagueName: string): any {
  // Normaliza nome da liga para buscar no JSON
  const map: Record<string, string> = {
    'Brasileirão Serie A': 'Brasileirao',
    'Brasileirão': 'Brasileirao',
    'Premier League': 'Premier League',
    'La Liga': 'La Liga',
    'Bundesliga': 'Bundesliga',
    'Serie A': 'Serie A',
    'Ligue 1': 'Ligue 1',
    'Championship': 'Championship',
    'Eredivisie': 'Eredivisie',
    'Primeira Liga': 'Primeira Liga',
    '2 Bundesliga': '2. Bundesliga',
  };

  const key = map[leagueName] || leagueName;
  const params = (dcParams as any)[key];
  if (!params) return null;

  return params;
}

function getTeamStrength(
  teamName: string,
  leagueParams: any,
  isHome: boolean
): TeamStrength {
  const teams = leagueParams.teams || {};
  const team = teams[teamName];
  if (!team) return { attack: 1, defense: 1 };

  return {
    attack: team.attack || 1,
    defense: team.defense || 1,
  };
}

export function predictMatch(
  homeTeam: string,
  awayTeam: string,
  leagueName: string
): MatchPrediction | null {
  const params = getLeagueParams(leagueName);
  if (!params) return null;

  const homeStrength = getTeamStrength(homeTeam, params, true);
  const awayStrength = getTeamStrength(awayTeam, params, false);
  const homeAdvantage = params.homeAdvantage || 1.1;

  const lambdaHome = Math.max(0.1, homeStrength.attack * awayStrength.defense * homeAdvantage);
  const lambdaAway = Math.max(0.1, awayStrength.attack * homeStrength.defense);

  let homeProb = 0, drawProb = 0, awayProb = 0;

  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      const p = poissonProb(lambdaHome, i) * poissonProb(lambdaAway, j);
      if (i > j) homeProb += p;
      else if (i === j) drawProb += p;
      else awayProb += p;
    }
  }

  const total = homeProb + drawProb + awayProb;
  return {
    homeProb: Math.round((homeProb / total) * 10000) / 100,
    drawProb: Math.round((drawProb / total) * 10000) / 100,
    awayProb: Math.round((awayProb / total) * 10000) / 100,
    homeOJ: homeProb > 0 ? Math.round((1 / (homeProb / total)) * 100) / 100 : 999,
    drawOJ: drawProb > 0 ? Math.round((1 / (drawProb / total)) * 100) / 100 : 999,
    awayOJ: awayProb > 0 ? Math.round((1 / (awayProb / total)) * 100) / 100 : 999,
  };
}

export function getLeagueContext(
  teamName: string,
  leagueName: string
): { avgCorners: number; avgShots: number; avgGoals: number } | null {
  const map: Record<string, string> = {
    'Brasileirão Serie A': 'Brasileirao',
    'Premier League': 'Premier League',
    'La Liga': 'La Liga',
    'Serie A': 'Serie A',
    'Bundesliga': 'Bundesliga',
  };
  return null; // Será preenchido com dados do JSON de médias
}
