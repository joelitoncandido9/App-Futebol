/**
 * Cálculo das Odds Justas — APENAS DADOS REAIS
 *
 * Sem suavização, sem priors Bayesianos, sem multiplicadores artificiais.
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

// P(Over X) = 1 - P(<= floor(X))
export function probOver(lambda: number, linha: number): number {
  if (lambda === 0) return 0;
  return Math.min(0.999, Math.max(0.001, 1 - poissonCumulative(lambda, Math.max(0, Math.floor(linha)))));
}

// P(Under X) = P(<= floor(X))
export function probUnder(lambda: number, linha: number): number {
  if (lambda === 0) return 0.999;
  return Math.min(0.999, Math.max(0.001, poissonCumulative(lambda, Math.max(0, Math.floor(linha)))));
}

// Odd justa = 1 / probabilidade
export function oddJusta(prob: number): number {
  if (prob <= 0) return 999;
  return Math.round((1 / prob) * 100) / 100;
}

// ── INTERFACES ──

export interface DadosAmostra {
  total_jogos: number;
  total_eventos: number;
}

export interface OddsContagem {
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
): OddsContagem {
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

// ── INTERFACE DO CARD (SIMPLIFICADA, SEM OJ2) ──

export interface CardMercadoData {
  tipo: 'contagem_dupla' | '1x2' | 'btts';
  titulo: string;
  time_casa: string;
  time_fora: string;
  // Contagem dupla (casa + fora)
  odds_casa?: OddsContagem;
  odds_fora?: OddsContagem;
  odds_combinado?: OddsContagem; // λ total da partida (casa + fora)
  amostra_casa: number;
  amostra_fora: number;
  // 1X2
  odds_1x2?: Odds1X2;
  // BTTS
  odds_btts?: { prob_sim: number; odd_sim: number; prob_nao: number; odd_nao: number };
  // Mercado
  odd_mercado?: number;
}

/**
 * Gera cards de mercado — APENAS com dados reais, sem suavização
 */
export function gerarCardsMercado(
  homeForm: any,
  awayForm: any,
  _oddsMercado: any,
  homeNome?: string,
  awayNome?: string
): CardMercadoData[] {
  const cards: CardMercadoData[] = [];

  const homeJogos = homeForm?.matches_played || 0;
  const awayJogos = awayForm?.matches_played || 0;
  const homeNomeTime = homeNome || 'Casa';
  const awayNomeTime = awayNome || 'Fora';

  if (homeJogos === 0 || awayJogos === 0) return cards;

  // Helper: cria card duplo + combinado
  function addCardContagemDupla(
    titulo: string, timeCasa: string, timeFora: string,
    mediaCasa: number | null, mediaFora: number | null,
    jogosCasa: number, jogosFora: number,
    linhas?: number[]
  ) {
    if (mediaCasa == null || mediaFora == null || jogosCasa <= 0 || jogosFora <= 0) return;
    const dadosCasa: DadosAmostra = { total_jogos: jogosCasa, total_eventos: Math.round(mediaCasa * jogosCasa) };
    const dadosFora: DadosAmostra = { total_jogos: jogosFora, total_eventos: Math.round(mediaFora * jogosFora) };
    // Combinado: λ total da partida = λ_casa + λ_fora
    const mediaCombinada = mediaCasa + mediaFora;
    const jogosCombinados = Math.min(jogosCasa, jogosFora);
    const dadosCombinados: DadosAmostra = { total_jogos: jogosCombinados, total_eventos: Math.round(mediaCombinada * jogosCombinados) };
    cards.push({
      tipo: 'contagem_dupla',
      titulo,
      time_casa: timeCasa,
      time_fora: timeFora,
      odds_casa: calcularOddsContagem(dadosCasa, linhas),
      odds_fora: calcularOddsContagem(dadosFora, linhas),
      odds_combinado: calcularOddsContagem(dadosCombinados, linhas),
      amostra_casa: jogosCasa,
      amostra_fora: jogosFora,
    });
  }

  // ── GOLS (usando home_goals_scored / away_goals_scored) ──
  const homeGols = homeForm?.home_goals_scored;
  const awayGols = awayForm?.away_goals_scored;
  if (homeGols != null && awayGols != null) {
    addCardContagemDupla(
      'GOLS', homeNomeTime, awayNomeTime,
      homeGols / homeJogos, awayGols / awayJogos,
      homeJogos, awayJogos,
      [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5]
    );
  }

  // ── FINALIZAÇÕES ──
  addCardContagemDupla(
    'FINALIZAÇÕES', homeNomeTime, awayNomeTime,
    homeForm?.avg_shots, awayForm?.avg_shots,
    homeJogos, awayJogos,
    [6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 18.5, 20.5, 22.5]
  );

  // ── CHUTES NO GOL ──
  addCardContagemDupla(
    'CHUTES NO GOL', homeNomeTime, awayNomeTime,
    homeForm?.avg_shots_on_target, awayForm?.avg_shots_on_target,
    homeJogos, awayJogos,
    [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5]
  );

  // ── CARTÕES ──
  addCardContagemDupla(
    'CARTÕES', homeNomeTime, awayNomeTime,
    homeForm?.avg_yellow_cards, awayForm?.avg_yellow_cards,
    homeJogos, awayJogos,
    [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5]
  );

  // ── FALTAS ──
  addCardContagemDupla(
    'FALTAS', homeNomeTime, awayNomeTime,
    homeForm?.avg_fouls, awayForm?.avg_fouls,
    homeJogos, awayJogos,
    [6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 18.5, 20.5, 22.5]
  );

  // ── GOLS ESPERADOS (xG) ──
  addCardContagemDupla(
    'GOLS ESPERADOS (xG)', homeNomeTime, awayNomeTime,
    homeForm?.avg_xg, awayForm?.avg_xg,
    homeJogos, awayJogos,
    [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
  );

  // ── PASSES-CHAVE ──
  addCardContagemDupla(
    'PASSES-CHAVE (por time)', homeNomeTime, awayNomeTime,
    homeForm?.avg_key_passes, awayForm?.avg_key_passes,
    homeJogos, awayJogos,
    [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5]
  );

  // ── ESCANTEIOS ──
  addCardContagemDupla(
    'ESCANTEIOS', homeNomeTime, awayNomeTime,
    homeForm?.avg_corners, awayForm?.avg_corners,
    homeJogos, awayJogos,
    [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5]
  );

  // ── IMPEDIMENTOS ──
  addCardContagemDupla(
    'IMPEDIMENTOS', homeNomeTime, awayNomeTime,
    homeForm?.avg_offsides, awayForm?.avg_offsides,
    homeJogos, awayJogos,
    [0.5, 1.5, 2.5, 3.5, 4.5, 5.5]
  );

  // ── DESARMES ──
  addCardContagemDupla(
    'DESARMES', homeNomeTime, awayNomeTime,
    homeForm?.avg_tackles, awayForm?.avg_tackles,
    homeJogos, awayJogos,
    [6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 18.5, 20.5]
  );

  // ── INTERCEPTAÇÕES ──
  addCardContagemDupla(
    'INTERCEPTAÇÕES', homeNomeTime, awayNomeTime,
    homeForm?.avg_interceptions, awayForm?.avg_interceptions,
    homeJogos, awayJogos,
    [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5]
  );

  // ── CRUZAMENTOS ──
  addCardContagemDupla(
    'CRUZAMENTOS', homeNomeTime, awayNomeTime,
    homeForm?.avg_crosses, awayForm?.avg_crosses,
    homeJogos, awayJogos,
    [4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 18.5]
  );

  // ── DRIBES ──
  addCardContagemDupla(
    'DRIBES', homeNomeTime, awayNomeTime,
    homeForm?.avg_dribbles, awayForm?.avg_dribbles,
    homeJogos, awayJogos,
    [2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5]
  );

  // ── DUELOS AÉREOS ──
  addCardContagemDupla(
    'DUELOS AÉREOS', homeNomeTime, awayNomeTime,
    homeForm?.avg_aerial_duels, awayForm?.avg_aerial_duels,
    homeJogos, awayJogos,
    [4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5]
  );

  // ── DEFESAS (goleiro) ──
  addCardContagemDupla(
    'DEFESAS (goleiro)', homeNomeTime, awayNomeTime,
    homeForm?.avg_saves, awayForm?.avg_saves,
    homeJogos, awayJogos,
    [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5]
  );

  // ── CARTÕES VERMELHOS ──
  addCardContagemDupla(
    'CARTÕES VERMELHOS', homeNomeTime, awayNomeTime,
    homeForm?.avg_red_cards, awayForm?.avg_red_cards,
    homeJogos, awayJogos,
    [0.5, 1.5, 2.5]
  );

  // ── GRANDES CHANCES ──
  addCardContagemDupla(
    'GRANDES CHANCES', homeNomeTime, awayNomeTime,
    homeForm?.avg_big_chances, awayForm?.avg_big_chances,
    homeJogos, awayJogos,
    [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5]
  );

  // ── CHUTES DE DENTRO DA ÁREA ──
  addCardContagemDupla(
    'CHUTES (dentro área)', homeNomeTime, awayNomeTime,
    homeForm?.avg_shots_inside_box, awayForm?.avg_shots_inside_box,
    homeJogos, awayJogos,
    [3.5, 5.5, 7.5, 9.5, 11.5, 13.5, 15.5]
  );

  // ── 1X2 (Poisson bivariada com xG real) ──
  const homeXg = homeForm?.avg_xg;
  const awayXg = awayForm?.avg_xg;
  if (homeXg != null && awayXg != null) {
    cards.push({
      tipo: '1x2',
      titulo: '1X2',
      time_casa: homeNomeTime,
      time_fora: awayNomeTime,
      odds_1x2: calcularOdds1X2(Math.max(0.3, homeXg), Math.max(0.3, awayXg)),
      amostra_casa: homeJogos,
      amostra_fora: awayJogos,
    });
  }

  // ── BTTS (proporção de clean sheets reais) ──
  const csCasa = homeForm?.clean_sheets;
  const csFora = awayForm?.clean_sheets;
  if (csCasa != null && csFora != null) {
    const total = homeJogos + awayJogos;
    const bttsSim = Math.max(0, total - csCasa - csFora);
    cards.push({
      tipo: 'btts',
      titulo: 'AMBOS MARCAM',
      time_casa: homeNomeTime,
      time_fora: awayNomeTime,
      odds_btts: calcularOddsBTTS(total, bttsSim),
      amostra_casa: homeJogos,
      amostra_fora: awayJogos,
    });
  }

  return cards;
}
