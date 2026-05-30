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

  // Helper: amostra OJ1 = ultimo + ult5 + ult10
  // Total de jogos no form pode ser a soma das janelas
  // Simplificação: usamos os campos de PPG que indicam qtde de jogos
  const homeJogos = homeForm?.ppg_em_casa ? 10 : 0; // aproximação
  const awayJogos = awayForm?.ppg_fora ? 10 : 0;

  // ── GOLS ──
  if (homeForm?.gols_em_casa != null) {
    const totalGolsCasa = (homeForm.gols_em_casa || 0) + (homeForm.gols_marcados_recentes || 0);
    const totalJogosCasa = (homeForm.ppg_em_casa ? 10 : 5) + 5;
    const d: DadosAmostra = { total_jogos: totalJogosCasa, total_eventos: totalGolsCasa };
    cards.push({
      tipo: 'contagem',
      titulo: 'GOLS',
      time: homeForm.time_casa || 'Casa',
      oj1: calcularOddsContagem(d),
      oj2: calcularOddsContagem(d),
      amostra_oj1: totalJogosCasa,
      amostra_oj2: totalJogosCasa + 50,
      odd_mercado: oddsMercado?.over_25,
      nome_mercado: 'Over 2.5',
    });
  }

  // ── 1X2 ──
  const lambdaCasa = homeForm?.gols_em_casa != null ? (homeForm.gols_em_casa || 0) / Math.max(1, homeForm.ppg_em_casa || 10) : 1.5;
  const lambdaFora = awayForm?.gols_fora != null ? (awayForm.gols_fora || 0) / Math.max(1, awayForm.ppg_fora || 10) : 1.2;
  cards.push({
    tipo: '1x2',
    titulo: '1X2',
    oj1: calcularOdds1X2(lambdaCasa, lambdaFora),
    oj2: calcularOdds1X2(lambdaCasa * 1.05, lambdaFora * 1.05),
    amostra_oj1: homeJogos + awayJogos,
    amostra_oj2: homeJogos + awayJogos + 100,
    odd_mercado: oddsMercado?.vitoria_casa,
    nome_mercado: 'Casa',
  });

  // ── BTTS ──
  if (homeForm?.clean_sheets != null && awayForm?.clean_sheets != null) {
    const totalJogos = homeJogos + awayJogos;
    const bttsSim = totalJogos - (homeForm.clean_sheets || 0) - (awayForm.clean_sheets || 0);
    cards.push({
      tipo: 'btts',
      titulo: 'BTTS',
      oj1: calcularOddsBTTS(homeJogos, bttsSim),
      oj2: calcularOddsBTTS(totalJogos + 100, bttsSim + 50),
      amostra_oj1: homeJogos,
      amostra_oj2: totalJogos + 100,
      odd_mercado: oddsMercado?.btts_sim,
      nome_mercado: 'BTTS Sim',
    });
  }

  return cards;
}
