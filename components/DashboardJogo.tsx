'use client';

import { useState, useEffect } from 'react';
import IncidentesTimeline from './IncidentesTimeline';
import { SkeletonDashboard } from './SkeletonCard';
import StatsAvancadas from './StatsAvancadas';
import PlayerStatsTabela from './PlayerStatsTabela';
import MatchAnalytics from './MatchAnalytics';
import MercadosAgrupados from './MercadosAgrupados';
import UltimosJogos from './UltimosJogos';
import { formatarHora, formatarDataCompleta, formatarDataCurta } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

function SectionBox({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-4 pt-3.5 pb-2 border-b border-border/40">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {titulo}
        </h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

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

  if (loading) return <SkeletonDashboard />;

  if (erro) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">⚠️</span>
        </div>
        <p className="text-sm text-muted-foreground">{erro}</p>
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

  const isAoVivo = jogo.status === 'inprogress' || jogo.status === 'halftime' || jogo.status === 'penalties' || jogo.status === 'extratime';
  const isFinalizado = jogo.status === 'finished';
  const isAovivoOuFinalizado = isAoVivo || isFinalizado;
  const escudoCasa = jogo.time_casa_id ? `https://sports.bzzoiro.com/img/team/${jogo.time_casa_id}/` : null;
  const escudoFora = jogo.time_fora_id ? `https://sports.bzzoiro.com/img/team/${jogo.time_fora_id}/` : null;

  return (
    <div className="space-y-3">
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

      {metadados?.fatos_curiosos && metadados.fatos_curiosos.length > 0 && (
        <div className="glass rounded-xl px-4 py-3">
          {metadados.fatos_curiosos.slice(0, 2).map((fato, idx) => (
            <p key={idx} className="text-[11px] text-muted-foreground italic leading-relaxed">
              💡 {fato}
            </p>
          ))}
        </div>
      )}

      {isAovivoOuFinalizado && (
        <SectionBox titulo="Análise da Partida">
          <MatchAnalytics
            statsAvancadas={stats_avancadas}
            shotmap={data.shotmap}
            xgPorMinuto={data.xg_por_minuto}
            momentum={data.momentum}
            averagePositions={data.average_positions}
            timeCasa={jogo.time_casa}
            timeFora={jogo.time_fora}
          />
        </SectionBox>
      )}

      {isAovivoOuFinalizado && incidents && incidents.length > 0 && (
        <SectionBox titulo="Cronologia">
          <IncidentesTimeline
            incidents={incidents}
            timeCasa={jogo.time_casa}
            timeFora={jogo.time_fora}
          />
        </SectionBox>
      )}

      {isAovivoOuFinalizado && player_stats && player_stats.length > 0 && (
        <SectionBox titulo="Jogadores">
          <PlayerStatsTabela
            players={player_stats}
            timeCasa={jogo.time_casa}
            timeFora={jogo.time_fora}
            teamIdCasa={jogo.time_casa_id}
            teamIdFora={jogo.time_fora_id}
          />
        </SectionBox>
      )}

      {data.lineups && <SectionBox titulo="Escalações"><LineupsDisplay data={data.lineups} timeCasa={jogo.time_casa} timeFora={jogo.time_fora} /></SectionBox>}

      {transmissoes && transmissoes.length > 0 && (
        <SectionBox titulo="Onde Assistir">
          <div className="flex flex-wrap gap-2">
            {transmissoes.map((tv, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg px-2.5 py-1.5 text-[11px]">
                <span className="text-foreground/80 font-medium">{tv.canal}</span>
                {tv.pais && (
                  <span className="text-muted-foreground ml-1">• {tv.pais}</span>
                )}
              </div>
            ))}
          </div>
        </SectionBox>
      )}

      <FormWidgets
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        formaCasa={forma_casa}
        formaFora={forma_fora}
        desfalquesCasa={desfalques_casa}
        desfalquesFora={desfalques_fora}
      />

      <StatsTable
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        formaCasa={forma_casa}
        formaFora={forma_fora}
      />

      <H2HSection
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        h2h={h2h}
      />

      <UltimosJogos
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        jogosCasa={data.ultimos_jogos_casa || []}
        jogosFora={data.ultimos_jogos_fora || []}
      />

      {tabela && tabela.length > 0 && (
        <StandingsTable
          timeCasa={jogo.time_casa}
          timeFora={jogo.time_fora}
          tabela={tabela}
        />
      )}

      {cards_mercado.length > 0 ? (
        <SectionBox titulo="Mercados & Odds Justas">
          <MercadosAgrupados cards={cards_mercado} oddsConsenso={odds_consenso} />
        </SectionBox>
      ) : (
        <p className="text-muted-foreground text-xs py-4 text-center">
          Dados estatísticos insuficientes para calcular odds justas deste jogo.
        </p>
      )}

      {hasOddsMercado && (
        <SectionBox titulo="Comparação de Odds (Mercado)">
          <MarketOddsSection oddsMercado={odds_mercado} />
        </SectionBox>
      )}

      {(tecnico_casa || tecnico_fora) && (
        <SectionBox titulo="Técnicos">
          <CoachesSection tecnicoCasa={tecnico_casa} tecnicoFora={tecnico_fora} timeCasa={jogo.time_casa} timeFora={jogo.time_fora} />
        </SectionBox>
      )}

      {arbitro?.nome && (
        <SectionBox titulo="Árbitro">
          <RefereeSection arbitro={arbitro} />
        </SectionBox>
      )}
    </div>
  );
}

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

  const homeLineup = data.home?.formation ? data.home : (typeof data.lineups?.home === 'object' ? data.lineups.home : null);
  const awayLineup = data.away?.formation ? data.away : (typeof data.lineups?.away === 'object' ? data.lineups.away : null);

  if (!homeLineup && !awayLineup) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <LineupCard time={timeCasa} lineup={homeLineup} lado="casa" />
      <LineupCard time={timeFora} lineup={awayLineup} lado="fora" />
    </div>
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
          <span className="text-primary text-xs font-mono font-bold">
            {formation}
          </span>
        )}
      </div>

      {players.length > 0 && (
        <div className="space-y-1 mb-3">
          <p className="text-muted-foreground text-[9px] uppercase tracking-wider mb-1">Titulares</p>
          {players.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono w-5 text-right text-[10px]">
                {p.jersey_number || p.numero || ''}
              </span>
              <span className="text-foreground/80">{p.name || p.nome || `#${p.id || ''}`}</span>
              {p.position && (
                <span className="text-muted-foreground text-[9px] uppercase">{p.position}</span>
              )}
              {p.ai_score != null && p.ai_score > 0 && (
                <span className="text-green-500/60 text-[9px] ml-auto">
                  {Math.round(p.ai_score * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {substitutes.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-muted-foreground text-[9px] uppercase tracking-wider mb-1">Reservas</p>
          <div className="flex flex-wrap gap-1">
            {substitutes.map((p: any, idx: number) => (
              <span key={idx} className="text-xs text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5">
                {p.name || p.nome || `#${p.id || ''}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchHeader({
  jogo, oddsConsenso, xgPosJogo, predicao, metadados,
  placar, periodo, xgAoVivo, contexto, estadio, clima, gramado,
  escudoCasa, escudoFora,
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

  const scoreCasa = placar?.casa ?? 0;
  const scoreFora = placar?.fora ?? 0;
  const casaVence = scoreCasa > scoreFora;
  const foraVence = scoreFora > scoreCasa;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="glass-strong rounded-xl p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
              {jogo.liga}
            </span>
            {jogo.rodada != null && (
              <span className="text-[9px] text-muted-foreground">{jogo.rodada}ª rodada</span>
            )}
            {contexto?.classico_local && (
              <span className="text-[9px] text-yellow-500/80">🏙️ Clássico!</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-4">
          <div className="flex-1 text-right">
            <div className="text-lg font-bold font-heading leading-tight text-foreground">
              {jogo.time_casa}
            </div>
          </div>

          <div className="text-center min-w-[100px]">
            {temPlacar ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-5xl font-black font-heading leading-none tabular-nums ${
                    casaVence ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]' :
                    'text-muted-foreground'
                  }`}>
                    {scoreCasa}
                  </span>
                  <span className="text-muted-foreground text-2xl font-bold">:</span>
                  <span className={`text-5xl font-black font-heading leading-none tabular-nums ${
                    foraVence ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]' :
                    'text-muted-foreground'
                  }`}>
                    {scoreFora}
                  </span>
                </div>
                {isAoVivo && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-500 text-[9px] font-bold uppercase tracking-widest">
                      {periodo?.atual === 'halftime' ? 'Intervalo' : periodo?.atual === '2nd_half' ? `${periodo?.minuto || ''}'` : 'Ao vivo'}
                    </span>
                  </div>
                )}
                {isFinalizado && (
                  <span className="text-muted-foreground text-[9px] font-medium mt-0.5">Final</span>
                )}
                {placar?.casa_ht != null && (
                  <span className="text-muted-foreground text-[8px] mt-0.5 font-mono">(HT {placar.casa_ht}-{placar.fora_ht})</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-muted-foreground text-[10px] font-bold">VS</span>
                </div>
                <span className="text-muted-foreground text-[9px] mt-1 font-mono">{formatarHora(jogo.data)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-left">
            <div className="text-lg font-bold font-heading leading-tight text-foreground">
              {jogo.time_fora}
            </div>
          </div>
        </div>

        {!isAoVivo && !isFinalizado && (
          <div className="flex justify-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground font-medium">1</span>
              <span className="text-xs font-mono font-bold text-foreground/90">{Number(oddsConsenso?.vitoria_casa ?? '-').toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground font-medium">X</span>
              <span className="text-xs font-mono text-foreground/70">{Number(oddsConsenso?.empate ?? '-').toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground font-medium">2</span>
              <span className="text-xs font-mono font-bold text-foreground/90">{Number(oddsConsenso?.vitoria_fora ?? '-').toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span>{formatarDataCompleta(jogo.data)}</span>
          {xgPosJogo?.xg_casa != null && (
            <span>xG {xgPosJogo.xg_casa.toFixed(2)} - {xgPosJogo.xg_fora?.toFixed(2)}</span>
          )}
          {xgAoVivo?.casa != null && (
            <span>xG⏳ {xgAoVivo.casa.toFixed(2)} - {xgAoVivo.fora?.toFixed(2)}</span>
          )}
          {!isAoVivo && !isFinalizado && oddsConsenso?.over_25 != null && (
            <span>+2.5 {Number(oddsConsenso.over_25).toFixed(2)}</span>
          )}
        </div>

        {(estadio || clima) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2.5 pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground">
            {estadio && <span>🏟️ {estadio.nome}{estadio.cidade ? `, ${estadio.cidade}` : ''}</span>}
            {clima && (
              <span>
                🌤️ {clima.descricao}{clima.temperatura_c != null ? ` ${clima.temperatura_c}°C` : ''}
              </span>
            )}
            {gramado != null && <span>🌱 {descricaoGramado(gramado)}</span>}
          </div>
        )}

        {pred && (
          <div className="mt-2.5 pt-2.5 border-t border-border/40">
            <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
              {pred.probabilidades && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500" style={{ width: `${pred.probabilidades.prob_home}%` }} />
                    <div className="h-full bg-yellow-500" style={{ width: `${pred.probabilidades.prob_draw}%` }} />
                    <div className="h-full bg-blue-500" style={{ width: `${pred.probabilidades.prob_away}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {pred.probabilidades.prob_home.toFixed(0)}% / {pred.probabilidades.prob_draw.toFixed(0)}% / {pred.probabilidades.prob_away.toFixed(0)}%
                  </span>
                </div>
              )}
              {pred.placar_provavel && (
                <span className="text-[9px] text-muted-foreground">
                  ML: <span className="text-foreground/80 font-mono font-bold">{pred.placar_provavel}</span>
                </span>
              )}
              {pred.confianca != null && (
                <span className="text-[9px] text-muted-foreground">
                  Conf: <span className="text-primary font-mono font-bold">{Math.round(pred.confianca * 100)}%</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormWidgets({
  timeCasa, timeFora, formaCasa, formaFora,
  desfalquesCasa, desfalquesFora,
}: {
  timeCasa: string; timeFora: string;
  formaCasa: Record<string, any>; formaFora: Record<string, any>;
  desfalquesCasa: string[]; desfalquesFora: string[];
}) {
  return (
    <SectionBox titulo="Médias por Time">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormCard time={timeCasa} forma={formaCasa} desfalques={desfalquesCasa} lado="casa" />
        <FormCard time={timeFora} forma={formaFora} desfalques={desfalquesFora} lado="fora" />
      </div>
    </SectionBox>
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
    <div className="bg-muted/30 rounded-lg p-3.5">
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
                {c === 'W' ? 'V' : c === 'D' ? 'E' : c === 'L' ? 'D' : c}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="bg-card/50 rounded p-2 text-center">
          <div className="text-muted-foreground">{ppgLabel}</div>
          <div className="text-foreground font-mono font-bold">{ppg ?? '-'}</div>
        </div>
        <div className="bg-card/50 rounded p-2 text-center">
          <div className="text-muted-foreground">Gols marcados</div>
          <div className="text-green-400 font-mono font-bold">
            {lado === 'casa' ? forma.gols_marcados_casa ?? forma.gols_marcados_fora ?? '-' : forma.gols_marcados_fora ?? forma.gols_marcados_casa ?? '-'}
          </div>
        </div>
        <div className="bg-card/50 rounded p-2 text-center">
          <div className="text-muted-foreground">Gols sofridos</div>
          <div className="text-red-400 font-mono font-bold">
            {lado === 'casa' ? forma.gols_sofridos_casa ?? forma.gols_sofridos_fora ?? '-' : forma.gols_sofridos_fora ?? forma.gols_sofridos_casa ?? '-'}
          </div>
        </div>
      </div>

      {forma.clean_sheets != null && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Jogos sem sofrer gols: <span className="text-foreground/80 font-mono">{forma.clean_sheets}</span>
        </div>
      )}

      {desfalques.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40 text-[11px]">
          <span className="text-red-400">Desfalques:</span>{' '}
          <span className="text-muted-foreground">{desfalques.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

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
    <SectionBox titulo="Comparativo de Médias">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left text-muted-foreground font-medium px-3 py-2">{timeCasa}</th>
              <th className="text-center text-muted-foreground font-medium px-2 py-2 w-16">Média</th>
              <th className="text-right text-muted-foreground font-medium px-3 py-2">{timeFora}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              if (s.casa == null && s.fora == null) return null;
              return (
                <tr key={s.label} className="border-b border-border/20 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <span className="text-foreground/80">{formatStat(s.casa, s.format)}</span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className="text-muted-foreground">{s.label}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-foreground/80">{formatStat(s.fora, s.format)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionBox>
  );
}

function formatStat(val: number | null, format?: 'float' | 'int' | 'pct'): string {
  if (val == null) return '-';
  if (format === 'float') return val.toFixed(2);
  if (format === 'int') return val.toFixed(0);
  return String(val);
}

function H2HSection({
  timeCasa, timeFora, h2h,
}: {
  timeCasa: string; timeFora: string; h2h: Record<string, any>;
}) {
  if (!h2h || !h2h.total_jogos) return null;

  const ultimos = h2h.ultimos_jogos || [];

  return (
    <SectionBox titulo="Confronto Direto">
      <div className="grid grid-cols-4 gap-2 mb-3 text-center text-[11px]">
        <div className="bg-muted/30 rounded p-2">
          <div className="text-muted-foreground">Total</div>
          <div className="text-foreground font-mono font-bold">{h2h.total_jogos}</div>
        </div>
        <div className="bg-green-900/15 rounded p-2">
          <div className="text-green-500">{timeCasa}</div>
          <div className="text-green-400 font-mono font-bold">{h2h.vitorias_casa ?? 0}</div>
        </div>
        <div className="bg-yellow-900/15 rounded p-2">
          <div className="text-yellow-500">Empates</div>
          <div className="text-yellow-400 font-mono font-bold">{h2h.empates ?? 0}</div>
        </div>
        <div className="bg-red-900/15 rounded p-2">
          <div className="text-red-500">{timeFora}</div>
          <div className="text-red-400 font-mono font-bold">{h2h.vitorias_fora ?? 0}</div>
        </div>
      </div>

      {h2h.media_gols != null && (
        <div className="text-[11px] text-muted-foreground mb-3">
          Média de gols no confronto: <span className="text-foreground/80 font-mono">{h2h.media_gols}</span>
        </div>
      )}

      {ultimos.length > 0 && (
        <div>
          <div className="text-[11px] text-muted-foreground font-semibold mb-2">Últimos confrontos:</div>
          <div className="space-y-0.5">
            {ultimos.map((m: H2HMatch, i: number) => (
              <div key={i} className="flex items-center justify-between text-[11px] bg-muted/30 rounded px-3 py-1.5">
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
    </SectionBox>
  );
}

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
    <SectionBox titulo="Classificação">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left text-muted-foreground font-medium px-2 py-1.5 w-8">#</th>
              <th className="text-left text-muted-foreground font-medium px-2 py-1.5">Time</th>
              <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-8">P</th>
              <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-6">J</th>
              <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-6">V</th>
              <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-6">E</th>
              <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-6">D</th>
              <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-10">SG</th>
              <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-12">F. Rec</th>
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
                  className={`border-b border-border/20 hover:bg-muted/30 ${
                    destaque ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className={`px-2 py-1.5 font-mono ${destaque ? 'text-primary' : 'text-muted-foreground'}`}>
                    {row.posicao}
                  </td>
                  <td className={`px-2 py-1.5 ${destaque ? 'text-primary font-medium' : 'text-foreground/80'}`}>
                    {row.time}
                  </td>
                  <td className="text-center px-1.5 py-1.5 font-mono font-bold text-foreground">{row.pontos}</td>
                  <td className="text-center px-1.5 py-1.5 font-mono text-muted-foreground">{row.jogos}</td>
                  <td className="text-center px-1.5 py-1.5 font-mono text-green-500">{row.vitorias}</td>
                  <td className="text-center px-1.5 py-1.5 font-mono text-yellow-500">{row.empates}</td>
                  <td className="text-center px-1.5 py-1.5 font-mono text-red-500">{row.derrotas}</td>
                  <td className={`text-center px-1.5 py-1.5 font-mono ${
                    row.saldo_gols >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {row.saldo_gols >= 0 ? `+${row.saldo_gols}` : row.saldo_gols}
                  </td>
                  <td className="text-center px-1.5 py-1.5">
                    {row.forma_recente && (
                      <span className="text-[10px] font-mono tracking-wider">
                        {row.forma_recente.split('').map((c, i) => (
                          <span key={i} className={
                            c === 'W' ? 'text-green-500' :
                            c === 'D' ? 'text-yellow-500' :
                            c === 'L' ? 'text-red-500' : 'text-muted-foreground'
                          }>{c === 'W' ? 'V' : c === 'D' ? 'E' : c === 'L' ? 'D' : c}</span>
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
    </SectionBox>
  );
}

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
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="text-foreground text-sm font-medium mb-2">{coach.nome}</div>
      <div className="space-y-1 text-[11px]">
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

function RefereeSection({ arbitro }: { arbitro: Record<string, any> }) {
  return (
    <div className="flex items-center gap-3 text-[11px] flex-wrap">
      <span className="text-foreground/80 font-medium">{arbitro.nome}</span>
      {arbitro.amarelos_jogo != null && (
        <span className="text-yellow-500">Amarelos/jogo: {arbitro.amarelos_jogo}</span>
      )}
      {arbitro.vermelhos_jogo != null && (
        <span className="text-red-500">Vermelhos/jogo: {arbitro.vermelhos_jogo}</span>
      )}
    </div>
  );
}

function MarketOddsSection({ oddsMercado }: { oddsMercado: Record<string, any> }) {
  const mercados = Object.entries(oddsMercado);

  if (mercados.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[10px]">Mercado</TableHead>
            <TableHead className="text-[10px]">Resultado</TableHead>
            <TableHead className="text-[10px] text-right">Melhor Odd</TableHead>
            <TableHead className="text-[10px] text-right">Casa</TableHead>
            <TableHead className="text-[10px] text-right">Pinnacle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mercados.flatMap(([mercado, outcomes]) =>
            Object.entries(outcomes).map(([outcome, data]: [string, any]) => (
              <TableRow key={`${mercado}-${outcome}`} className="border-border hover:bg-muted/30">
                <TableCell className="py-1.5 text-[10px] text-muted-foreground font-medium">{mercado}</TableCell>
                <TableCell className="py-1.5 text-[10px] text-foreground/80">{outcome}</TableCell>
                <TableCell className="py-1.5 text-[10px] text-right font-mono font-bold text-primary">
                  {data.melhor_odd ?? '-'}
                </TableCell>
                <TableCell className="py-1.5 text-[10px] text-right font-mono text-muted-foreground">
                  {data.melhor_casa ?? '-'}
                </TableCell>
                <TableCell className="py-1.5 text-[10px] text-right font-mono text-muted-foreground">
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
