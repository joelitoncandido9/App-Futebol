'use client';

import { useState, useEffect } from 'react';
import LoadingIndicator from './LoadingIndicator';
import IncidentesTimeline from './IncidentesTimeline';
import StatsAvancadas from './StatsAvancadas';
import PlayerStatsTabela from './PlayerStatsTabela';
import MatchAnalytics from './MatchAnalytics';
import MercadosAgrupados from './MercadosAgrupados';
import UltimosJogos from './UltimosJogos';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Tipos ──

interface CoachData {
  nome: string;
  formacao_preferida?: string;
  pressing_intensity?: number;
  defensive_line?: string;
  top_styles?: string[];
}

interface TabelaRow {
  posicao: number;
  time: string;
  time_id?: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  saldo_gols: number;
  pontos: number;
  forma_recente?: string;
}

interface H2HMatch {
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  event_date?: string;
}

interface DashboardData {
  jogo: {
    event_id: number;
    data: string;
    liga: string;
    pais: string;
    liga_id?: number;
    rodada?: number;
    time_casa: string;
    time_fora: string;
    time_casa_id?: number;
    time_fora_id?: number;
    status: string;
  };
  odds_consenso: Record<string, number | null>;
  odds_mercado: Record<string, any>;
  cards_mercado: any[];
  forma_casa: Record<string, any>;
  forma_fora: Record<string, any>;
  h2h: Record<string, any>;
  arbitro: Record<string, any>;
  desfalques_casa: string[];
  desfalques_fora: string[];
  tecnico_casa: CoachData | null;
  tecnico_fora: CoachData | null;
  tabela: TabelaRow[] | null;
  xg_pos_jogo: { xg_casa: number | null; xg_fora: number | null } | null;
  // Novos dados
  incidents?: any[];
  stats_avancadas?: { home: any; away: any } | null;
  shotmap?: any[] | null;
  momentum?: any[] | null;
  xg_por_minuto?: any[] | null;
  average_positions?: any;
  lineups?: any;
  player_stats?: any[] | null;
  predicao?: {
    modelo: string;
    confianca: number;
    probabilidades: { prob_home: number; prob_draw: number; prob_away: number };
    expected_goals: { home: number; away: number };
    over_under: { prob_over_15: number; prob_over_25: number; prob_over_35: number };
    btts_sim_pct: number;
    placar_provavel: string;
    recomendacoes: any;
  } | null;
  metadados?: {
    fatos_curiosos: string[] | null;
    preview_ia: string | null;
  };
  transmissoes?: Array<{
    pais: string;
    canal: string;
    inicio: string;
  }> | null;
  // Novos campos
  placar?: { casa: number | null; fora: number | null; casa_ht: number | null; fora_ht: number | null };
  periodo?: { atual: string | null; minuto: number | null };
  xg_ao_vivo?: { casa: number | null; fora: number | null };
  contexto?: { classico_local: boolean; distancia_km: number | null; campo_neutro: boolean | null };
  estadio?: { id: number; nome: string; cidade: string; pais: string; capacidade: number | null } | null;
  clima?: { codigo: number; descricao: string; vento_kmh: number | null; temperatura_c: number | null } | null;
  gramado?: number | null;
  uniformes?: any;
  ultimos_jogos_casa?: Array<{ data: string; casa: string; fora: string; gols_casa: number | null; gols_fora: number | null }>;
  ultimos_jogos_fora?: Array<{ data: string; casa: string; fora: string; gols_casa: number | null; gols_fora: number | null }>;
}

interface DashboardJogoProps {
  eventId: number;
}

// ── Section Wrapper (collapsible) ──

function SectionWrapper({
  titulo,
  emoji,
  defaultOpen = true,
  children,
}: {
  titulo: string;
  emoji?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden glow-accent transition-all duration-200">
      {/* Gradient accent bar on top */}
      <div className="h-0.5 bg-gradient-to-r from-orange-500/80 via-orange-400/40 to-transparent" />

      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/50/50 transition-colors"
      >
        <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em]">
          {emoji && <span className="mr-2">{emoji}</span>}
          {titulo}
        </h3>
        <span className={`text-muted-foreground text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

// ── Componente Principal ──

export default function DashboardJogo({ eventId }: DashboardJogoProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro('');
      try {
        const res = await fetch(`/api/dashboard/${eventId}`);
        if (!res.ok) throw new Error('Erro ao carregar dashboard');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [eventId]);

  if (loading) return <LoadingIndicator mensagem="Carregando dashboard..." />;

  if (erro) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">{erro}</p>
      </div>
    );
  }

  if (!data) return null;

  const {
    jogo, cards_mercado, odds_consenso, odds_mercado,
    forma_casa, forma_fora, h2h, arbitro,
    desfalques_casa, desfalques_fora,
    tecnico_casa, tecnico_fora, tabela,
    incidents, stats_avancadas, player_stats, predicao,
    metadados, transmissoes,
    placar, periodo, xg_ao_vivo, contexto, estadio, clima, gramado, uniformes,
  } = data;

  const hasOddsMercado = odds_mercado && Object.keys(odds_mercado).length > 0;

  // Verifica status do jogo
  const isAoVivo = jogo.status === 'inprogress' || jogo.status === 'halftime' || jogo.status === 'penalties' || jogo.status === 'extratime';
  const isFinalizado = jogo.status === 'finished';
  const isAovivoOuFinalizado = isAoVivo || isFinalizado;
  const escudoCasa = jogo.time_casa_id ? `https://sports.bzzoiro.com/img/team/${jogo.time_casa_id}/` : null;
  const escudoFora = jogo.time_fora_id ? `https://sports.bzzoiro.com/img/team/${jogo.time_fora_id}/` : null;

  return (
    <div className="space-y-5">
      {/* ── MATCH HEADER ── */}
      <MatchHeader
        jogo={jogo}
        oddsConsenso={odds_consenso}
        xgPosJogo={data.xg_pos_jogo}
        predicao={predicao}
        metadados={metadados}
        placar={placar}
        periodo={periodo}
        xgAoVivo={xg_ao_vivo}
        contexto={contexto}
        estadio={estadio}
        clima={clima}
        gramado={gramado}
        escudoCasa={escudoCasa}
        escudoFora={escudoFora}
      />

      {/* ── ANÁLISE DA PARTIDA (tabs: Stats, Shotmap, xG, Pressão) ── */}
      {isAovivoOuFinalizado && (
        <MatchAnalytics
          statsAvancadas={stats_avancadas}
          shotmap={data.shotmap}
          xgPorMinuto={data.xg_por_minuto}
          momentum={data.momentum}
          averagePositions={data.average_positions}
          timeCasa={jogo.time_casa}
          timeFora={jogo.time_fora}
        />
      )}

      {/* ── ⚽ CRONOLOGIA (apenas ao vivo/finalizado) ── */}
      {isAovivoOuFinalizado && incidents && incidents.length > 0 && (
        <IncidentesTimeline
          incidents={incidents}
          timeCasa={jogo.time_casa}
          timeFora={jogo.time_fora}
        />
      )}

      {/* ── 🌟 PLAYER RATINGS (apenas ao vivo/finalizado) ── */}
      {isAovivoOuFinalizado && player_stats && player_stats.length > 0 && (
        <PlayerStatsTabela
          players={player_stats}
          timeCasa={jogo.time_casa}
          timeFora={jogo.time_fora}
          teamIdCasa={jogo.time_casa_id}
          teamIdFora={jogo.time_fora_id}
        />
      )}

      {/* ── 📋 ESCALAÇÕES ── */}
      {data.lineups && <LineupsDisplay data={data.lineups} timeCasa={jogo.time_casa} timeFora={jogo.time_fora} />}

      {/* ── 📺 ONDE ASSISTIR ── */}
      {transmissoes && transmissoes.length > 0 && (
        <SectionWrapper titulo="Onde Assistir" emoji="📺">
          <div className="flex flex-wrap gap-2">
            {transmissoes.map((tv, idx) => (
              <div key={idx} className="bg-zinc-800/40 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-foreground/80 font-medium">{tv.canal}</span>
                {tv.pais && (
                  <span className="text-muted-foreground ml-1.5">• {tv.pais}</span>
                )}
              </div>
            ))}
          </div>
        </SectionWrapper>
      )}

      {/* ── 📈 MÉDIAS POR TIME ── */}
      <FormWidgets
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        formaCasa={forma_casa}
        formaFora={forma_fora}
        desfalquesCasa={desfalques_casa}
        desfalquesFora={desfalques_fora}
      />

      {/* ── 📊 ESTATÍSTICAS (médias) ── */}
      <StatsTable
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        formaCasa={forma_casa}
        formaFora={forma_fora}
      />

      {/* ── 🤝 H2H ── */}
      <H2HSection
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        h2h={h2h}
      />

      {/* ── 📋 ÚLTIMOS 10 JOGOS ── */}
      <UltimosJogos
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        jogosCasa={data.ultimos_jogos_casa || []}
        jogosFora={data.ultimos_jogos_fora || []}
      />

      {/* ── 🏆 CLASSIFICAÇÃO ── */}
      {tabela && tabela.length > 0 && (
        <StandingsTable
          timeCasa={jogo.time_casa}
          timeFora={jogo.time_fora}
          tabela={tabela}
        />
      )}

      {/* ── 🎯 ODDS JUSTAS (agrupadas em abas) ── */}
      {cards_mercado.length > 0 ? (
        <MercadosAgrupados cards={cards_mercado} />
      ) : (
        <p className="text-muted-foreground text-sm py-4 text-center">
          Dados estatísticos insuficientes para calcular odds justas deste jogo.
        </p>
      )}

      {/* ── 💰 COMPARAÇÃO ODDS ── */}
      {hasOddsMercado && (
        <SectionWrapper titulo="Comparação de Odds (Mercado)" emoji="💰">
          <MarketOddsSection oddsMercado={odds_mercado} />
        </SectionWrapper>
      )}

      {/* ── 🧑‍🏫 TÉCNICOS + ÁRBITRO ── */}
      {(tecnico_casa || tecnico_fora) && (
        <SectionWrapper titulo="Técnicos" emoji="🧑‍🏫">
          <CoachesSection tecnicoCasa={tecnico_casa} tecnicoFora={tecnico_fora} timeCasa={jogo.time_casa} timeFora={jogo.time_fora} />
        </SectionWrapper>
      )}

      {arbitro?.nome && (
        <SectionWrapper titulo="Árbitro" emoji="⚖️">
          <RefereeSection arbitro={arbitro} />
        </SectionWrapper>
      )}
    </div>
  );
}

// ── Section Title Helper ──

function SectionTitle({ titulo }: { titulo: string }) {
  return (
    <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">
      {titulo}
    </h3>
  );
}

// ── LINEUPS DISPLAY ──

function LineupsDisplay({
  data,
  timeCasa,
  timeFora,
}: {
  data: any;
  timeCasa: string;
  timeFora: string;
}) {
  if (!data) return null;

  // Tenta extrair escalações de diferentes formatos (v1 embutido vs v2)
  const homeLineup = data.home?.formation ? data.home : (typeof data.lineups?.home === 'object' ? data.lineups.home : null);
  const awayLineup = data.away?.formation ? data.away : (typeof data.lineups?.away === 'object' ? data.lineups.away : null);

  if (!homeLineup && !awayLineup) return null;

  return (
    <SectionWrapper titulo="Escalações" emoji="📋">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LineupCard time={timeCasa} lineup={homeLineup} lado="casa" />
        <LineupCard time={timeFora} lineup={awayLineup} lado="fora" />
      </div>
    </SectionWrapper>
  );
}

function LineupCard({
  time,
  lineup,
  lado,
}: {
  time: string;
  lineup: any;
  lado: 'casa' | 'fora';
}) {
  if (!lineup) {
    return (
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-muted-foreground text-xs">Escalação não disponível para {time}</p>
      </div>
    );
  }

  const formation = lineup.formation || lineup.preferred_formation || '';
  const players = lineup.players || lineup.titulares || [];
  const substitutes = lineup.substitutes || lineup.reservas || [];

  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-foreground text-sm font-medium">{time}</span>
        {formation && (
          <span className="text-orange-400 text-xs font-mono font-bold">
            {formation}
          </span>
        )}
      </div>

      {players.length > 0 && (
        <div className="space-y-1 mb-3">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Titulares</p>
          {players.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono w-5 text-right">
                {p.jersey_number || p.numero || ''}
              </span>
              <span className="text-foreground/80">{p.name || p.nome || `#${p.id || ''}`}</span>
              {p.position && (
                <span className="text-muted-foreground text-[10px] uppercase">{p.position}</span>
              )}
              {p.ai_score != null && p.ai_score > 0 && (
                <span className="text-green-500/60 text-[10px] ml-auto">
                  {Math.round(p.ai_score * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {substitutes.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Reservas</p>
          <div className="flex flex-wrap gap-1">
            {substitutes.map((p: any, idx: number) => (
              <span key={idx} className="text-xs text-muted-foreground bg-zinc-800/40 rounded px-1.5 py-0.5">
                {p.name || p.nome || `#${p.id || ''}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MATCH HEADER ──

function MatchHeader({
  jogo,
  oddsConsenso,
  xgPosJogo,
  predicao,
  metadados,
  placar,
  periodo,
  xgAoVivo,
  contexto,
  estadio,
  clima,
  gramado,
  escudoCasa,
  escudoFora,
}: {
  jogo: DashboardData['jogo'];
  oddsConsenso: Record<string, number | null>;
  xgPosJogo: { xg_casa: number | null; xg_fora: number | null } | null;
  predicao: DashboardData['predicao'];
  metadados: DashboardData['metadados'];
  placar: DashboardData['placar'];
  periodo: DashboardData['periodo'];
  xgAoVivo: DashboardData['xg_ao_vivo'];
  contexto: DashboardData['contexto'];
  estadio: DashboardData['estadio'];
  clima: DashboardData['clima'];
  gramado: DashboardData['gramado'];
  escudoCasa: string | null;
  escudoFora: string | null;
}) {
  const pred = predicao;
  const temPlacar = placar?.casa != null || placar?.fora != null;
  const isAoVivo = jogo.status === 'inprogress' || jogo.status === 'halftime' || jogo.status === 'penalties' || jogo.status === 'extratime';
  const isFinalizado = jogo.status === 'finished';

  function descricaoGramado(val: number | null | undefined): string {
    if (val == null) return '';
    const map: Record<number, string> = { 1: 'Excelente', 2: 'Bom', 3: 'Regular', 4: 'Ruim', 5: 'Péssimo' };
    return map[val] || '';
  }

  return (
    <div className="card-destaque overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-purple-500/30" />

      <div className="p-5">
        {/* League + round + contexto */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-1">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="bg-orange-500/10 text-orange-400 px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-[0.08em] text-[10px]">
              {jogo.liga}
            </span>
            {jogo.rodada != null && (
              <span className="text-muted-foreground text-[10px] font-mono">
                {jogo.rodada}ª rodada
              </span>
            )}
            {contexto?.classico_local && (
              <span className="badge-moderno bg-yellow-500/10 text-yellow-500">🏙️ Clássico!</span>
            )}
            {contexto?.campo_neutro && (
              <span className="badge-moderno bg-zinc-700/30 text-muted-foreground">Neutro</span>
            )}
          </div>
          {jogo.pais && (
            <span className="text-muted-foreground text-[10px]">{jogo.pais}</span>
          )}
        </div>

        {/* Teams + placar - estilo Sofascore */}
        <div className="flex items-center justify-center gap-4 md:gap-10 py-5">
          {/* Time Casa */}
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-2">
              {escudoCasa && (
                <img src={escudoCasa} alt={jogo.time_casa} className="w-8 h-8 object-contain" />
              )}
              <div className="text-lg md:text-xl font-bold text-foreground leading-tight">{jogo.time_casa}</div>
            </div>
            {oddsConsenso?.vitoria_casa && !isAoVivo && !isFinalizado && (
              <div className="inline-block mt-2 bg-orange-500/10 text-orange-400 font-mono text-sm font-bold px-3 py-0.5 rounded-md">
                {Number(oddsConsenso.vitoria_casa).toFixed(2)}
              </div>
            )}
          </div>

          {/* Placar / VS central */}
          <div className="text-center min-w-[90px]">
            {(isAoVivo || isFinalizado) && temPlacar ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-4xl md:text-5xl font-black leading-none ${placar!.casa! > placar!.fora! ? 'text-white' : placar!.casa! < placar!.fora! ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {placar!.casa}
                  </span>
                  <span className="text-muted-foreground text-2xl font-bold">:</span>
                  <span className={`text-4xl md:text-5xl font-black leading-none ${placar!.fora! > placar!.casa! ? 'text-white' : placar!.fora! < placar!.casa! ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {placar!.fora}
                  </span>
                </div>
                {isAoVivo && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-500 text-[10px] font-bold uppercase tracking-[0.1em]">
                      {periodo?.atual === 'halftime' ? 'Intervalo' : periodo?.atual === '2nd_half' ? `${periodo?.minuto || ''}'` : 'Ao vivo'}
                    </span>
                  </div>
                )}
                {isFinalizado && (
                  <span className="text-muted-foreground text-[10px] font-medium mt-1">Final</span>
                )}
                {placar?.casa_ht != null && (
                  <span className="text-muted-foreground text-[9px] mt-1 font-mono">HT {placar.casa_ht}-{placar.fora_ht}</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-muted-foreground text-xs font-bold">VS</span>
                </div>
                <span className="text-muted-foreground text-[10px] mt-1.5 font-mono">{formatarHoraCurta(jogo.data)}</span>
              </div>
            )}
          </div>

          {/* Time Fora */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              {escudoFora && (
                <img src={escudoFora} alt={jogo.time_fora} className="w-8 h-8 object-contain" />
              )}
              <div className="text-lg md:text-xl font-bold text-foreground leading-tight">{jogo.time_fora}</div>
            </div>
            {oddsConsenso?.vitoria_fora && !isAoVivo && !isFinalizado && (
              <div className="inline-block mt-2 bg-orange-500/10 text-orange-400 font-mono text-sm font-bold px-3 py-0.5 rounded-md">
                {Number(oddsConsenso.vitoria_fora).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Info bar */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground mt-2 flex-wrap">
          <span className="text-muted-foreground">{formatarDataCompleta(jogo.data)}</span>
          {xgPosJogo?.xg_casa != null && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-muted-foreground">Gols Esperados <span className="text-green-400/80">{xgPosJogo.xg_casa.toFixed(2)}</span> - <span className="text-blue-400/80">{xgPosJogo.xg_fora?.toFixed(2)}</span></span>
            </>
          )}
          {xgAoVivo?.casa != null && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-muted-foreground">GE⏳ <span className="text-green-400/80">{xgAoVivo.casa.toFixed(2)}</span> - <span className="text-blue-400/80">{xgAoVivo.fora?.toFixed(2)}</span></span>
            </>
          )}
          {!isAoVivo && !isFinalizado && (
            <>
              {oddsConsenso?.over_25 != null && (
                <><span className="text-zinc-700">·</span><span>+2.5 <span className="text-orange-400/80">{Number(oddsConsenso.over_25).toFixed(2)}</span></span></>
              )}
              {oddsConsenso?.btts_sim != null && (
                <><span className="text-zinc-700">·</span><span>Ambos Marcam <span className="text-orange-400/80">{Number(oddsConsenso.btts_sim).toFixed(2)}</span></span></>
              )}
            </>
          )}
        </div>

        {/* Consensus odds (não iniciados) */}
        {!isAoVivo && !isFinalizado && (
          <div className="flex justify-center gap-5 mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">1</span>
              <span className="text-foreground/80 font-mono font-bold">{Number(oddsConsenso?.vitoria_casa ?? '-').toFixed(2)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">X</span>
              <span className="text-foreground/80 font-mono">{Number(oddsConsenso?.empate ?? '-').toFixed(2)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">2</span>
              <span className="text-foreground/80 font-mono font-bold">{Number(oddsConsenso?.vitoria_fora ?? '-').toFixed(2)}</span>
            </span>
          </div>
        )}

        {/* Venue + Clima + Contexto */}
        {(estadio || clima || contexto?.distancia_km) && (
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
            {estadio && <span>🏟️ <span className="text-muted-foreground">{estadio.nome}</span>{estadio.cidade ? <span className="text-muted-foreground">, {estadio.cidade}</span> : ''}</span>}
            {clima && (
              <span>
                🌤️ {clima.descricao}{clima.temperatura_c != null ? ` ${clima.temperatura_c}°C` : ''}{clima.vento_kmh ? ` 🌬️${clima.vento_kmh}km/h` : ''}
              </span>
            )}
            {gramado != null && <span>🌱 <span className="text-muted-foreground capitalize">{descricaoGramado(gramado)}</span></span>}
            {contexto?.distancia_km != null && contexto.distancia_km > 0 && <span>✈️ <span className="text-muted-foreground">{contexto.distancia_km}km</span></span>}
          </div>
        )}

        {/* Predição ML */}
        {pred && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">🤖 ML</span>
              {pred.probabilidades && (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500/80" />
                    <span className="text-green-400 font-mono text-sm font-bold">{pred.probabilidades.prob_home?.toFixed(0)}%</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <span className="text-yellow-400 font-mono font-semibold">{pred.probabilidades.prob_draw?.toFixed(0)}%</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500/80" />
                    <span className="text-blue-400 font-mono text-sm font-bold">{pred.probabilidades.prob_away?.toFixed(0)}%</span>
                  </span>
                </div>
              )}
              {pred.placar_provavel && (
                <span className="text-muted-foreground text-[11px]">
                  Placar: <span className="text-foreground/80 font-mono font-bold">{pred.placar_provavel}</span>
                </span>
              )}
              {pred.confianca != null && (
                <span className="text-muted-foreground text-[11px]">
                  Confiança: <span className="text-orange-400 font-mono font-bold">{Math.round(pred.confianca * 100)}%</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fatos curiosos */}
        {metadados?.fatos_curiosos && metadados.fatos_curiosos.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/60">
            {metadados.fatos_curiosos.slice(0, 2).map((fato: string, idx: number) => (
              <p key={idx} className="text-xs text-muted-foreground italic leading-relaxed">💡 {fato}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatarHoraCurta(dataStr: string): string {
  try {
    const d = new Date(dataStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ── FORM WIDGETS ──

function FormWidgets({
  timeCasa, timeFora, formaCasa, formaFora,
  desfalquesCasa, desfalquesFora,
}: {
  timeCasa: string; timeFora: string;
  formaCasa: Record<string, any>; formaFora: Record<string, any>;
  desfalquesCasa: string[]; desfalquesFora: string[];
}) {
  return (
    <SectionWrapper titulo="Médias por Time" emoji="📈">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormCard time={timeCasa} forma={formaCasa} desfalques={desfalquesCasa} lado="casa" />
        <FormCard time={timeFora} forma={formaFora} desfalques={desfalquesFora} lado="fora" />
      </div>
    </SectionWrapper>
  );
}

function FormCard({
  time, forma, desfalques, lado,
}: {
  time: string; forma: Record<string, any>; desfalques: string[]; lado: 'casa' | 'fora';
}) {
  const ppgLabel = lado === 'casa' ? 'Pontos por jogo (casa)' : 'Pontos por jogo (fora)';
  const ppg = lado === 'casa' ? forma.ppg_casa : forma.ppg_fora;

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-foreground text-sm font-semibold">{time}</h4>
        {forma.ultimos_jogos && (
          <span className="text-xs font-mono tracking-wider">
            {forma.ultimos_jogos.split('').map((c: string, i: number) => (
              <span
                key={i}
                className={
                  c === 'W' ? 'text-green-500' :
                  c === 'D' ? 'text-yellow-500' :
                  c === 'L' ? 'text-red-500' : 'text-muted-foreground'
                }
              >
                {c}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-card rounded p-2 text-center">
          <div className="text-muted-foreground">{ppgLabel}</div>
          <div className="text-foreground font-mono font-bold">{ppg ?? '-'}</div>
        </div>
        <div className="bg-card rounded p-2 text-center">
          <div className="text-muted-foreground">Gols marcados</div>
          <div className="text-green-400 font-mono font-bold">
            {lado === 'casa' ? forma.gols_marcados_casa ?? forma.gols_marcados_fora ?? '-' : forma.gols_marcados_fora ?? forma.gols_marcados_casa ?? '-'}
          </div>
        </div>
        <div className="bg-card rounded p-2 text-center">
          <div className="text-muted-foreground">Gols sofridos</div>
          <div className="text-red-400 font-mono font-bold">
            {lado === 'casa' ? forma.gols_sofridos_casa ?? forma.gols_sofridos_fora ?? '-' : forma.gols_sofridos_fora ?? forma.gols_sofridos_casa ?? '-'}
          </div>
        </div>
      </div>

      {forma.clean_sheets != null && (
        <div className="mt-2 text-xs text-muted-foreground">
          Jogos sem sofrer gols: <span className="text-foreground/80 font-mono">{forma.clean_sheets}</span>
        </div>
      )}

      {desfalques.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 text-xs">
          <span className="text-red-400">Desfalques:</span>{' '}
          <span className="text-muted-foreground">{desfalques.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

// ── STATS TABLE ──

function StatsTable({
  timeCasa, timeFora, formaCasa, formaFora,
}: {
  timeCasa: string; timeFora: string;
  formaCasa: Record<string, any>; formaFora: Record<string, any>;
}) {
  if (!formaCasa || Object.keys(formaCasa).length === 0) return null;

  const stats: Array<{
    label: string; casa: number | null; fora: number | null; format?: 'float' | 'int' | 'pct';
  }> = [
    { label: 'Gols marcados (casa/fora)', casa: formaCasa.gols_marcados_casa, fora: formaFora.gols_marcados_fora, format: 'int' },
    { label: 'Gols sofridos (casa/fora)', casa: formaCasa.gols_sofridos_casa, fora: formaFora.gols_sofridos_fora, format: 'int' },
    { label: 'Gols esperados (xG) p/j', casa: formaCasa.avg_xg, fora: formaFora.avg_xg, format: 'float' },
    { label: 'xG sofrido p/j', casa: formaCasa.avg_xg_conceded, fora: formaFora.avg_xg_conceded, format: 'float' },
    { label: 'Chutes por jogo', casa: formaCasa.avg_shots, fora: formaFora.avg_shots, format: 'float' },
    { label: 'Chutes no gol p/j', casa: formaCasa.avg_shots_on_target, fora: formaFora.avg_shots_on_target, format: 'float' },
    { label: 'Passes-chave p/j', casa: formaCasa.avg_key_passes, fora: formaFora.avg_key_passes, format: 'float' },
    { label: 'Faltas por jogo', casa: formaCasa.avg_fouls, fora: formaFora.avg_fouls, format: 'float' },
    { label: 'Cartões amarelos p/j', casa: formaCasa.avg_yellow_cards, fora: formaFora.avg_yellow_cards, format: 'float' },
    { label: 'Jogos sem sofrer gols', casa: formaCasa.clean_sheets, fora: formaFora.clean_sheets, format: 'int' },
    { label: 'Rating', casa: formaCasa.avg_team_rating, fora: formaFora.avg_team_rating, format: 'float' },
  ];

  const hasData = stats.some((s) => s.casa != null || s.fora != null);
  if (!hasData) return null;

  return (
    <SectionWrapper titulo="Comparativo de Médias" emoji="📊">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-muted-foreground font-medium px-4 py-2">{timeCasa}</th>
              <th className="text-center text-muted-foreground font-medium px-3 py-2 w-16">Média</th>
              <th className="text-right text-muted-foreground font-medium px-4 py-2">{timeFora}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              if (s.casa == null && s.fora == null) return null;
              return (
                <tr key={s.label} className="border-b border-border/30 hover:bg-muted/80">
                  <td className="px-4 py-2.5">
                    <span className="text-foreground/80">{formatStat(s.casa, s.format)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-muted-foreground">{s.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-foreground/80">{formatStat(s.fora, s.format)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

function formatStat(val: number | null, format?: 'float' | 'int' | 'pct'): string {
  if (val == null) return '-';
  if (format === 'float') return val.toFixed(2);
  if (format === 'int') return val.toFixed(0);
  return String(val);
}

// ── H2H ──

function H2HSection({
  timeCasa, timeFora, h2h,
}: {
  timeCasa: string; timeFora: string; h2h: Record<string, any>;
}) {
  if (!h2h || !h2h.total_jogos) return null;

  const ultimos = h2h.ultimos_jogos || [];

  return (
    <SectionWrapper titulo="Confronto Direto" emoji="🤝">
      <div className="grid grid-cols-4 gap-3 mb-4 text-center text-xs">
        <div className="bg-zinc-800/40 rounded p-2">
          <div className="text-muted-foreground">Total</div>
          <div className="text-foreground font-mono font-bold">{h2h.total_jogos}</div>
        </div>
        <div className="bg-green-900/20 rounded p-2">
          <div className="text-green-500">{timeCasa}</div>
          <div className="text-green-400 font-mono font-bold">{h2h.vitorias_casa ?? 0}</div>
        </div>
        <div className="bg-yellow-900/20 rounded p-2">
          <div className="text-yellow-500">Empates</div>
          <div className="text-yellow-400 font-mono font-bold">{h2h.empates ?? 0}</div>
        </div>
        <div className="bg-red-900/20 rounded p-2">
          <div className="text-red-500">{timeFora}</div>
          <div className="text-red-400 font-mono font-bold">{h2h.vitorias_fora ?? 0}</div>
        </div>
      </div>

      {h2h.media_gols != null && (
        <div className="text-xs text-muted-foreground mb-3">
          Média de gols no confronto: <span className="text-foreground/80 font-mono">{h2h.media_gols}</span>
        </div>
      )}

      {ultimos.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground font-semibold mb-2">Últimos confrontos:</div>
          <div className="space-y-1">
            {ultimos.map((m: H2HMatch, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                <span className="text-foreground/80">
                  {m.home_team} {m.home_score ?? '?'} - {m.away_score ?? '?'} {m.away_team}
                </span>
                {m.event_date && (
                  <span className="text-muted-foreground">{formatarDataCurta(m.event_date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionWrapper>
  );
}

// ── STANDINGS ──

function StandingsTable({
  timeCasa, timeFora, tabela,
}: {
  timeCasa: string; timeFora: string; tabela: TabelaRow[];
}) {
  const casaRow = tabela.find(
    (r) => r.time?.toLowerCase() === timeCasa.toLowerCase()
  );
  const foraRow = tabela.find(
    (r) => r.time?.toLowerCase() === timeFora.toLowerCase()
  );

  const destacarTimes = new Set<string>();
  if (casaRow) destacarTimes.add(casaRow.time);
  if (foraRow) destacarTimes.add(foraRow.time);

  const linhasVisiveis = tabela.filter((r) => r.posicao <= 6 || destacarTimes.has(r.time));

  return (
    <SectionWrapper titulo="Classificação" emoji="🏆">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-muted-foreground font-medium px-3 py-2 w-8">#</th>
              <th className="text-left text-muted-foreground font-medium px-3 py-2">Time</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-8">P</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-8">J</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-8">V</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-8">E</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-8">D</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-10">SG</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-12">F. Rec</th>
            </tr>
          </thead>
          <tbody>
            {linhasVisiveis.map((row) => {
              const isCasa = row.time?.toLowerCase() === timeCasa.toLowerCase();
              const isFora = row.time?.toLowerCase() === timeFora.toLowerCase();
              const destaque = isCasa || isFora;
              return (
                <tr
                  key={row.posicao}
                  className={`border-b border-border/30 hover:bg-muted/80 ${
                    destaque ? 'bg-orange-500/5' : ''
                  }`}
                >
                  <td className={`px-3 py-2 font-mono ${destaque ? 'text-orange-400' : 'text-muted-foreground'}`}>
                    {row.posicao}
                  </td>
                  <td className={`px-3 py-2 ${destaque ? 'text-orange-300 font-medium' : 'text-foreground/80'}`}>
                    {row.time}
                  </td>
                  <td className="text-center px-2 py-2 font-mono font-bold text-foreground">{row.pontos}</td>
                  <td className="text-center px-2 py-2 font-mono text-muted-foreground">{row.jogos}</td>
                  <td className="text-center px-2 py-2 font-mono text-green-500">{row.vitorias}</td>
                  <td className="text-center px-2 py-2 font-mono text-yellow-500">{row.empates}</td>
                  <td className="text-center px-2 py-2 font-mono text-red-500">{row.derrotas}</td>
                  <td className={`text-center px-2 py-2 font-mono ${
                    row.saldo_gols >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {row.saldo_gols >= 0 ? `+${row.saldo_gols}` : row.saldo_gols}
                  </td>
                  <td className="text-center px-2 py-2">
                    {row.forma_recente && (
                      <span className="text-xs font-mono tracking-wider">
                        {row.forma_recente.split('').map((c, i) => (
                          <span key={i} className={
                            c === 'W' ? 'text-green-500' :
                            c === 'D' ? 'text-yellow-500' :
                            c === 'L' ? 'text-red-500' : 'text-muted-foreground'
                          }>{c}</span>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

// ── COACHES ──

function CoachesSection({
  tecnicoCasa, tecnicoFora, timeCasa, timeFora,
}: {
  tecnicoCasa: CoachData | null; tecnicoFora: CoachData | null;
  timeCasa: string; timeFora: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {tecnicoCasa && <CoachCard time={timeCasa} coach={tecnicoCasa} />}
      {tecnicoFora && <CoachCard time={timeFora} coach={tecnicoFora} />}
    </div>
  );
}

function CoachCard({ time, coach }: { time: string; coach: CoachData }) {
  if (!coach?.nome) return null;

  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="text-foreground text-sm font-medium mb-2">{coach.nome}</div>
      <div className="space-y-1 text-xs">
        {coach.formacao_preferida && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Formação</span>
            <span className="text-foreground/80 font-mono">{coach.formacao_preferida}</span>
          </div>
        )}
        {coach.pressing_intensity != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pressão</span>
            <span className="text-foreground/80 font-mono">{(coach.pressing_intensity * 100).toFixed(0)}%</span>
          </div>
        )}
        {coach.defensive_line && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Linha defensiva</span>
            <span className="text-foreground/80">{coach.defensive_line}</span>
          </div>
        )}
        {coach.top_styles && coach.top_styles.length > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estilo</span>
            <span className="text-foreground/80 text-right max-w-[200px]">{coach.top_styles.slice(0, 3).join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── REFEREE ──

function RefereeSection({ arbitro }: { arbitro: Record<string, any> }) {
  return (
    <div className="flex items-center gap-4 text-xs flex-wrap">
      <span className="text-foreground/80 font-medium">{arbitro.nome}</span>
      {arbitro.amarelos_jogo != null && (
        <>
          <span className="text-zinc-700">|</span>
          <span className="text-yellow-500">Amarelos/jogo: {arbitro.amarelos_jogo}</span>
        </>
      )}
      {arbitro.vermelhos_jogo != null && (
        <>
          <span className="text-zinc-700">|</span>
          <span className="text-red-500">Vermelhos/jogo: {arbitro.vermelhos_jogo}</span>
        </>
      )}
    </div>
  );
}

// ── MARKET ODDS COMPARISON ──

function MarketOddsSection({ oddsMercado }: { oddsMercado: Record<string, any> }) {
  const mercados = Object.entries(oddsMercado);

  if (mercados.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px]">Mercado</TableHead>
            <TableHead className="text-[11px]">Resultado</TableHead>
            <TableHead className="text-[11px] text-right">Melhor Odd</TableHead>
            <TableHead className="text-[11px] text-right">Casa</TableHead>
            <TableHead className="text-[11px] text-right">Pinnacle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mercados.flatMap(([mercado, outcomes]) =>
            Object.entries(outcomes).map(([outcome, data]: [string, any]) => (
              <TableRow key={`${mercado}-${outcome}`} className="border-gray-100 hover:bg-muted/50">
                <TableCell className="py-2 text-[11px] text-muted-foreground font-medium">{mercado}</TableCell>
                <TableCell className="py-2 text-[11px] text-foreground/80">{outcome}</TableCell>
                <TableCell className="py-2 text-[11px] text-right font-mono font-bold text-orange-600">
                  {data.melhor_odd ?? '-'}
                </TableCell>
                <TableCell className="py-2 text-[11px] text-right font-mono text-muted-foreground">
                  {data.melhor_casa ?? '-'}
                </TableCell>
                <TableCell className="py-2 text-[11px] text-right font-mono text-gray-600">
                  {data.pinnacle_odd ?? '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Date Helpers ──

function formatarDataCompleta(dataStr: string): string {
  try {
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dataStr;
  }
}

function formatarDataCurta(dataStr: string): string {
  try {
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
  } catch {
    return dataStr;
  }
}
