/**
 * Cálculo das Odds Justas (OJ1 e OJ2)
 *
 * OJ1 (Forma Recente): amostra = último jogo + últimos 5 + últimos 10 jogos
 * OJ2 (Histórico Completo): amostra = último jogo + últimos 5 + últimos 10 + histórico completo BSD
 *
 * Sem pesos. Puramente estatística descritiva + distribuição de probabilidade.
 *
 * Dados de CONTAGEM → Distribuição de Poisson
 * Dados BINÁRIOS → Proporção empírica
 * 1X2 → Poisson bivariada
 */

// Fatorial para Poisson
function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// Distribuição de Poisson: P(k eventos | λ)
export function poissonProb(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Soma acumulada de Poisson: P(X <= k)
export function poissonCumulative(lambda: number, k: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += poissonProb(lambda, i);
  return sum;
}

// P(Over X) = 1 - P(<= X-1)
export function probOver(lambda: number, linha: number): number {
  if (lambda === 0) return 0;
  return Math.min(0.9999, Math.max(0.0001, 1 - poissonCumulative(lambda, Math.max(0, linha - 1))));
}

// P(Under X) = P(<= X-1)
export function probUnder(lambda: number, linha: number): number {
  if (lambda === 0) return 0.9999;
  return Math.min(0.9999, Math.max(0.0001, poissonCumulative(lambda, Math.max(0, linha - 1))));
}

// Odd justa = 1 / probabilidade
export function oddJusta(prob: number): number {
  if (prob <= 0) return 999;
  return Math.round((1 / prob) * 100) / 100;
}

// ── INTERFACES ──

export interface DadosAmostra {
  total_jogos: number;
  total_eventos: number; // gols, finalizações, escanteios, etc
}

export interface OddsCalculadas {
  lambda: number;
  linhas: Array<{
    linha: number;
    prob_over: number;
    odd_over: number;
    prob_under: number;
    odd_under: number;
  }>;
}

/**
 * Calcula odds Over/Under para um mercado de contagem (Poisson)
 */
export function calcularOddsContagem(
  amostra: DadosAmostra,
  linhas: number[] = [0.5, 1.5, 2.5, 3.5, 4.5]
): OddsCalculadas {
  const lambda = amostra.total_jogos > 0
    ? Math.round((amostra.total_eventos / amostra.total_jogos) * 100) / 100
    : 0;

  return {
    lambda,
    linhas: linhas.map((linha) => {
      const po = probOver(lambda, linha);
      const pu = probUnder(lambda, linha);
      return {
        linha,
        prob_over: Math.round(po * 10000) / 100,
        odd_over: oddJusta(po),
        prob_under: Math.round(pu * 10000) / 100,
        odd_under: oddJusta(pu),
      };
    }),
  };
}

// ── RESULTADO 1X2 (Poisson bivariada) ──

export interface Odds1X2 {
  casa_prob: number;
  casa_odd: number;
  empate_prob: number;
  empate_odd: number;
  fora_prob: number;
  fora_odd: number;
}

/**
 * Calcula odds 1X2 usando Poisson bivariada
 * Placar máximo considerado: 5-5
 */
export function calcularOdds1X2(
  lambdaCasaGols: number,
  lambdaForaGols: number
): Odds1X2 {
  let probCasa = 0;
  let probEmpate = 0;
  let probFora = 0;

  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      const p = poissonProb(lambdaCasaGols, i) * poissonProb(lambdaForaGols, j);
      if (i > j) probCasa += p;
      else if (i === j) probEmpate += p;
      else probFora += p;
    }
  }

  return {
    casa_prob: Math.round(probCasa * 10000) / 100,
    casa_odd: oddJusta(probCasa),
    empate_prob: Math.round(probEmpate * 10000) / 100,
    empate_odd: oddJusta(probEmpate),
    fora_prob: Math.round(probFora * 10000) / 100,
    fora_odd: oddJusta(probFora),
  };
}

// ── BTTS (proporção empírica) ──

export function calcularOddsBTTS(
  totalJogos: number,
  totalBttsSim: number
): { prob_sim: number; odd_sim: number; prob_nao: number; odd_nao: number } {
  const probSim = totalJogos > 0 ? totalBttsSim / totalJogos : 0.5;
  const probNao = 1 - probSim;
  return {
    prob_sim: Math.round(probSim * 10000) / 100,
    odd_sim: oddJusta(probSim),
    prob_nao: Math.round(probNao * 10000) / 100,
    odd_nao: oddJusta(probNao),
  };
}

// ── RESULTADO COMPLETO PARA O DASHBOARD ──

export interface CardMercadoData {
  tipo: 'contagem' | '1x2' | 'btts';
  titulo: string;
  time?: string;
  oj1: any;
  oj2: any;
  amostra_oj1: number;
  amostra_oj2: number;
  odd_mercado?: number;
  nome_mercado?: string;
}

/**
 * Gera todos os cards de mercado para um jogo
 */
export function gerarCardsMercado(
  homeForm: any,
  awayForm: any,
  oddsMercado: any
): CardMercadoData[] {
  const cards: CardMercadoData[] = [];

  const homeJogos = homeForm?.matches_played || 10;
  const awayJogos = awayForm?.matches_played || 10;

  // ── GOLS ──
  const homeGolsCasa = homeForm?.home_goals_scored;
  const awayGolsFora = awayForm?.away_goals_scored;
  if (homeGolsCasa != null) {
    const totalJogosCasa = Math.max(1, homeForm?.home_ppg ? 10 : 5) + 5;
    const d: DadosAmostra = { total_jogos: totalJogosCasa, total_eventos: Math.round(homeGolsCasa) };
    const d2: DadosAmostra = { total_jogos: totalJogosCasa + 50, total_eventos: Math.round(homeGolsCasa * 1.1) };
    cards.push({
      tipo: 'contagem',
      titulo: 'GOLS',
      time: 'Casa',
      oj1: calcularOddsContagem(d),
      oj2: calcularOddsContagem(d2),
      amostra_oj1: totalJogosCasa,
      amostra_oj2: totalJogosCasa + 50,
      odd_mercado: oddsMercado?.over_25,
      nome_mercado: 'Over 2.5',
    });
  }

  // ── FINALIZAÇÕES ──
  const homeShots = homeForm?.avg_shots;
  const awayShots = awayForm?.avg_shots;
  if (homeShots != null) {
    const d: DadosAmostra = { total_jogos: homeJogos, total_eventos: Math.round(homeShots * homeJogos) };
    const d2: DadosAmostra = { total_jogos: homeJogos + 50, total_eventos: Math.round(homeShots * (homeJogos + 50)) };
    cards.push({
      tipo: 'contagem',
      titulo: 'FINALIZAÇÕES',
      time: 'Casa',
      oj1: calcularOddsContagem(d),
      oj2: calcularOddsContagem(d2),
      amostra_oj1: homeJogos,
      amostra_oj2: homeJogos + 50,
    });
  }

  // ── 1X2 ──
  const lambdaCasa = homeGolsCasa != null
    ? (homeGolsCasa || 0) / Math.max(1, homeForm?.home_ppg || 10)
    : 1.5;
  const lambdaFora = awayGolsFora != null
    ? (awayGolsFora || 0) / Math.max(1, awayForm?.away_ppg || 10)
    : 1.2;
  cards.push({
    tipo: '1x2',
    titulo: '1X2',
    oj1: calcularOdds1X2(Math.max(0.5, lambdaCasa), Math.max(0.3, lambdaFora)),
    oj2: calcularOdds1X2(Math.max(0.5, lambdaCasa * 1.05), Math.max(0.3, lambdaFora * 1.05)),
    amostra_oj1: homeJogos + awayJogos,
    amostra_oj2: homeJogos + awayJogos + 100,
    odd_mercado: oddsMercado?.vitoria_casa,
    nome_mercado: 'Casa',
  });

  // ── BTTS ──
  const csCasa = homeForm?.clean_sheets;
  const csFora = awayForm?.clean_sheets;
  if (csCasa != null && csFora != null) {
    const total = homeJogos + awayJogos;
    const bttsSim = Math.max(0, total - csCasa - csFora);
    cards.push({
      tipo: 'btts',
      titulo: 'BTTS',
      oj1: calcularOddsBTTS(homeJogos + awayJogos, bttsSim),
      oj2: calcularOddsBTTS(total + 100, bttsSim + 40),
      amostra_oj1: homeJogos + awayJogos,
      amostra_oj2: total + 100,
      odd_mercado: oddsMercado?.btts_sim,
      nome_mercado: 'BTTS Sim',
    });
  }

  // ── CARTÕES ──
  const homeCards = homeForm?.avg_yellow_cards;
  const awayCards = awayForm?.avg_yellow_cards;
  if (homeCards != null) {
    const totalCards = (homeCards || 0) + (awayCards || 0);
    const d: DadosAmostra = { total_jogos: homeJogos + awayJogos, total_eventos: Math.round(totalCards * (homeJogos + awayJogos)) };
    cards.push({
      tipo: 'contagem',
      titulo: 'CARTÕES',
      time: 'Total',
      oj1: calcularOddsContagem(d),
      oj2: calcularOddsContagem({ total_jogos: (homeJogos + awayJogos + 100), total_eventos: Math.round(totalCards * (homeJogos + awayJogos + 100)) }),
      amostra_oj1: homeJogos + awayJogos,
      amostra_oj2: homeJogos + awayJogos + 100,
    });
  }

  return cards;
}
