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

export interface MatchPrediction {
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
  const map: Record<string, string> = {
    'Brasileirão Serie A': 'Brasileirao',
    'Brasileirão Serie B': 'Brasileirao',
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

  // Busca exata primeiro, depois parcial
  let key = map[leagueName];
  if (!key) {
    const entry = Object.entries(map).find(([k]) => leagueName?.includes(k));
    key = entry ? entry[1] : leagueName;
  }
  const params = (dcParams as any)[key];
  if (!params) return null;

  return params;
}

/** Normaliza nome do time BSD → nome no JSON de parâmetros */
function normalizarNomeTime(nome: string): string {
  const map: Record<string, string> = {
    'Athletico': 'Athletico-PR',
    'Athletico-PR': 'Athletico-PR',
    'Atlético Mineiro': 'Atletico-MG',
    'Atlético-GO': 'Atletico GO',
    'Atletico GO': 'Atletico GO',
    'Atletico-MG': 'Atletico-MG',
    'América MG': 'America MG',
    'América-MG': 'America MG',
    'Botafogo': 'Botafogo RJ',
    'Botafogo RJ': 'Botafogo RJ',
    'Bragantino': 'Bragantino',
    'Red Bull Bragantino': 'Bragantino',
    'Chapecoense': 'Chapecoense-SC',
    'Chapecoense-SC': 'Chapecoense-SC',
    'Ceará': 'Ceara',
    'Coritiba': 'Coritiba',
    'Criciúma': 'Criciuma',
    'Cruzeiro': 'Cruzeiro',
    'Cuiabá': 'Cuiaba',
    'Flamengo': 'Flamengo RJ',
    'Flamengo RJ': 'Flamengo RJ',
    'Fluminense': 'Fluminense',
    'Fortaleza': 'Fortaleza',
    'Goiás': 'Goias',
    'Grêmio': 'Gremio',
    'Internacional': 'Internacional',
    'Juventude': 'Juventude',
    'Mirassol': 'Mirassol',
    'Náutico': 'Nautico',
    'Palmeiras': 'Palmeiras',
    'Ponte Preta': 'Ponte Preta',
    'Remo': 'Remo',
    'Santos': 'Santos',
    'São Paulo': 'Sao Paulo',
    'Sport Recife': 'Sport Recife',
    'Vasco': 'Vasco',
    'Vasco da Gama': 'Vasco',
    'Vitória': 'Vitoria',
    'Athletic Club': 'Athletico-PR', // fallback aproximado
  };

  return map[nome] || nome;
}

function getTeamStrength(
  teamName: string,
  leagueParams: any,
  _isHome: boolean
): TeamStrength | null {
  const teams: string[] = leagueParams.teams || [];
  const attack: number[] = leagueParams.attack || [];
  const defense: number[] = leagueParams.defense || [];

  const nomeNorm = normalizarNomeTime(teamName);
  const idx = teams.indexOf(nomeNorm);
  if (idx === -1 || idx >= attack.length || idx >= defense.length) return null;

  return {
    attack: attack[idx],
    defense: defense[idx],
  };
}

export interface MatchLambdas {
  lambdaHome: number;
  lambdaAway: number;
  homeProb: number;
  drawProb: number;
  awayProb: number;
}

export function calculateMatchLambdas(
  homeTeam: string,
  awayTeam: string,
  leagueName: string
): MatchLambdas | null {
  const params = getLeagueParams(leagueName);
  if (!params) return null;

  const homeStrength = getTeamStrength(homeTeam, params, true);
  const awayStrength = getTeamStrength(awayTeam, params, false);
  if (!homeStrength || !awayStrength) return null;

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
    lambdaHome: Math.round(lambdaHome * 100) / 100,
    lambdaAway: Math.round(lambdaAway * 100) / 100,
    homeProb: Math.round((homeProb / total) * 10000) / 100,
    drawProb: Math.round((drawProb / total) * 10000) / 100,
    awayProb: Math.round((awayProb / total) * 10000) / 100,
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
  if (!homeStrength || !awayStrength) return null;

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
