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
  oddsMercado: any,
  homeNome?: string,
  awayNome?: string
): CardMercadoData[] {
  const cards: CardMercadoData[] = [];

  const homeJogos = homeForm?.matches_played || 10;
  const awayJogos = awayForm?.matches_played || 10;
  const homeNomeTime = homeNome || 'Casa';
  const awayNomeTime = awayNome || 'Fora';

  // Helper: cria card de contagem para um time
  function addCardContagem(titulo: string, time: string, mediaPorJogo: number, jogos: number, amostraExtraOJ2: number = 50, linhas?: number[]) {
    if (mediaPorJogo == null || jogos <= 0) return;
    const totalEventos = Math.round(mediaPorJogo * jogos);
    const d1: DadosAmostra = { total_jogos: jogos, total_eventos: totalEventos };
    const d2: DadosAmostra = { total_jogos: jogos + amostraExtraOJ2, total_eventos: Math.round(mediaPorJogo * (jogos + amostraExtraOJ2)) };
    cards.push({
      tipo: 'contagem',
      titulo,
      time,
      oj1: calcularOddsContagem(d1, linhas),
      oj2: calcularOddsContagem(d2, linhas),
      amostra_oj1: jogos,
      amostra_oj2: jogos + amostraExtraOJ2,
    });
  }

  // ── GOLS (casa usa home_goals_scored, fora usa away_goals_scored) ──
  const homeGols = homeForm?.home_goals_scored;
  const awayGols = awayForm?.away_goals_scored;
  if (homeGols != null) {
    const jogosCasa = Math.max(1, homeForm?.home_ppg ? Math.round(homeForm.home_ppg * 4) : 10);
    const media = homeGols / jogosCasa;
    addCardContagem('GOLS', homeNomeTime, media, jogosCasa, 50);
  }
  if (awayGols != null) {
    const jogosFora = Math.max(1, awayForm?.away_ppg ? Math.round(awayForm.away_ppg * 4) : 10);
    const media = awayGols / jogosFora;
    addCardContagem('GOLS', awayNomeTime, media, jogosFora, 50);
  }

  // ── FINALIZAÇÕES ──
  addCardContagem('FINALIZAÇÕES', homeNomeTime, homeForm?.avg_shots, homeJogos, 50, [8.5, 10.5, 12.5, 14.5, 16.5]);
  addCardContagem('FINALIZAÇÕES', awayNomeTime, awayForm?.avg_shots, awayJogos, 50, [8.5, 10.5, 12.5, 14.5, 16.5]);

  // ── CHUTES NO GOL ──
  addCardContagem('CHUTES NO GOL', homeNomeTime, homeForm?.avg_shots_on_target, homeJogos, 50, [2.5, 3.5, 4.5, 5.5, 6.5]);
  addCardContagem('CHUTES NO GOL', awayNomeTime, awayForm?.avg_shots_on_target, awayJogos, 50, [2.5, 3.5, 4.5, 5.5, 6.5]);

  // ── CARTÕES ──
  addCardContagem('CARTÕES', homeNomeTime, homeForm?.avg_yellow_cards, homeJogos, 50, [1.5, 2.5, 3.5, 4.5]);
  addCardContagem('CARTÕES', awayNomeTime, awayForm?.avg_yellow_cards, awayJogos, 50, [1.5, 2.5, 3.5, 4.5]);

  // ── FALTAS ──
  addCardContagem('FALTAS', homeNomeTime, homeForm?.avg_fouls, homeJogos, 50, [8.5, 10.5, 12.5, 14.5, 16.5]);
  addCardContagem('FALTAS', awayNomeTime, awayForm?.avg_fouls, awayJogos, 50, [8.5, 10.5, 12.5, 14.5, 16.5]);

  // ── 1X2 ──
  // Usa avg_xg ou goals_scored como média de gols, com fallback seguro
  const homeGolsMedia = homeForm?.avg_xg != null
    ? homeForm.avg_xg
    : homeGols != null
      ? homeGols / Math.max(1, homeForm?.matches_played || 10)
      : 1.5;
  const awayGolsMedia = awayForm?.avg_xg != null
    ? awayForm.avg_xg
    : awayGols != null
      ? awayGols / Math.max(1, awayForm?.matches_played || 10)
      : 1.2;
  cards.push({
    tipo: '1x2',
    titulo: '1X2',
    oj1: calcularOdds1X2(Math.max(0.3, homeGolsMedia), Math.max(0.3, awayGolsMedia)),
    oj2: calcularOdds1X2(Math.max(0.3, homeGolsMedia * 1.1), Math.max(0.3, awayGolsMedia * 1.1)),
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

  // ── xG ──
  addCardContagem('xG', homeNomeTime, homeForm?.avg_xg, homeJogos, 50, [0.5, 1.0, 1.5, 2.0, 2.5]);
  addCardContagem('xG', awayNomeTime, awayForm?.avg_xg, awayJogos, 50, [0.5, 1.0, 1.5, 2.0, 2.5]);

  return cards;
}
