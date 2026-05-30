'use client';

import { useState, useEffect } from 'react';
import CardMercado from './CardMercado';
import LoadingIndicator from './LoadingIndicator';

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
}

interface DashboardJogoProps {
  eventId: number;
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
  } = data;

  const hasOddsMercado = odds_mercado && Object.keys(odds_mercado).length > 0;

  return (
    <div className="space-y-5">
      {/* ── MATCH HEADER ── */}
      <MatchHeader jogo={jogo} oddsConsenso={odds_consenso} xgPosJogo={data.xg_pos_jogo} />

      {/* ── FORM WIDGETS ── */}
      <FormWidgets
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        formaCasa={forma_casa}
        formaFora={forma_fora}
        desfalquesCasa={desfalques_casa}
        desfalquesFora={desfalques_fora}
      />

      {/* ── STATS TABLE ── */}
      <StatsTable
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        formaCasa={forma_casa}
        formaFora={forma_fora}
      />

      {/* ── H2H ── */}
      <H2HSection
        timeCasa={jogo.time_casa}
        timeFora={jogo.time_fora}
        h2h={h2h}
      />

      {/* ── STANDINGS ── */}
      {tabela && tabela.length > 0 && (
        <StandingsTable
          timeCasa={jogo.time_casa}
          timeFora={jogo.time_fora}
          tabela={tabela}
        />
      )}

      {/* ── COACHES ── */}
      {(tecnico_casa || tecnico_fora) && (
        <CoachesSection
          timeCasa={jogo.time_casa}
          timeFora={jogo.time_fora}
          tecnicoCasa={tecnico_casa}
          tecnicoFora={tecnico_fora}
        />
      )}

      {/* ── REFEREE ── */}
      {arbitro?.nome && <RefereeSection arbitro={arbitro} />}

      {/* ── FAIR ODDS CARDS ── */}
      <div>
        <SectionTitle titulo="Odds Justas por Mercado" />
        {cards_mercado.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards_mercado.map((card, idx) => (
              <CardMercado
                key={`${card.tipo}-${idx}`}
                titulo={card.titulo}
                time={card.time}
                tipo={card.tipo}
                oj1={card.oj1}
                oj2={card.oj2}
                amostraOJ1={card.amostra_oj1}
                amostraOJ2={card.amostra_oj2}
                timeCasa={card.time_casa}
                timeFora={card.time_fora}
                oj1Casa={card.oj1_casa}
                oj2Casa={card.oj2_casa}
                oj1Fora={card.oj1_fora}
                oj2Fora={card.oj2_fora}
                amostraCasa={card.amostra_casa}
                amostraFora={card.amostra_fora}
                oddMercado={card.odd_mercado}
                nomeMercado={card.nome_mercado}
              />
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 text-sm py-4 text-center">
            Dados estatísticos insuficientes para calcular odds justas deste jogo.
          </p>
        )}
      </div>

      {/* ── MARKET ODDS COMPARISON ── */}
      {hasOddsMercado && (
        <MarketOddsSection oddsMercado={odds_mercado} />
      )}
    </div>
  );
}

// ── Section Title Helper ──

function SectionTitle({ titulo }: { titulo: string }) {
  return (
    <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
      {titulo}
    </h3>
  );
}

// ── MATCH HEADER ──

function MatchHeader({
  jogo,
  oddsConsenso,
  xgPosJogo,
}: {
  jogo: DashboardData['jogo'];
  oddsConsenso: Record<string, number | null>;
  xgPosJogo: { xg_casa: number | null; xg_fora: number | null } | null;
}) {
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-5">
      {/* League + round */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-orange-500 font-semibold uppercase tracking-wider">
            {jogo.liga}
          </span>
          {jogo.rodada != null && (
            <>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500">{jogo.rodada}ª rodada</span>
            </>
          )}
        </div>
        {jogo.pais && (
          <span className="text-zinc-600 text-xs">{jogo.pais}</span>
        )}
      </div>

      {/* Teams + odds */}
      <div className="flex items-center justify-center gap-4 md:gap-8 py-4">
        <div className="flex-1 text-right">
          <div className="text-lg font-bold text-zinc-100">{jogo.time_casa}</div>
          {oddsConsenso?.vitoria_casa && (
            <div className="text-orange-400 font-mono text-sm mt-1">
              {Number(oddsConsenso.vitoria_casa).toFixed(2)}
            </div>
          )}
        </div>
        <div className="text-center">
          <div className="text-zinc-600 text-xs font-medium mb-1 px-3 py-1 bg-zinc-800/50 rounded-full">VS</div>
        </div>
        <div className="flex-1 text-left">
          <div className="text-lg font-bold text-zinc-100">{jogo.time_fora}</div>
          {oddsConsenso?.vitoria_fora && (
            <div className="text-orange-400 font-mono text-sm mt-1">
              {Number(oddsConsenso.vitoria_fora).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Date + status + xG */}
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-600 mt-2">
        <span>{formatarDataCompleta(jogo.data)}</span>
        <span className="text-zinc-700">|</span>
        <span className="capitalize">{jogo.status === 'notstarted' ? 'Não iniciado' : jogo.status}</span>
        {xgPosJogo?.xg_casa != null && (
          <>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">xG: {xgPosJogo.xg_casa.toFixed(2)} / {xgPosJogo.xg_fora?.toFixed(2)}</span>
          </>
        )}
      </div>

      {/* Consensus odds bar */}
      <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-zinc-800/50 text-xs text-zinc-600">
        <span>1 {Number(oddsConsenso?.vitoria_casa ?? '-').toFixed(2)}</span>
        <span className="text-zinc-700">|</span>
        <span>X {Number(oddsConsenso?.empate ?? '-').toFixed(2)}</span>
        <span className="text-zinc-700">|</span>
        <span>2 {Number(oddsConsenso?.vitoria_fora ?? '-').toFixed(2)}</span>
        {oddsConsenso?.over_25 != null && (
          <>
            <span className="text-zinc-700">|</span>
            <span>O25 {Number(oddsConsenso.over_25).toFixed(2)}</span>
          </>
        )}
        {oddsConsenso?.btts_sim != null && (
          <>
            <span className="text-zinc-700">|</span>
            <span>BTTS {Number(oddsConsenso.btts_sim).toFixed(2)}</span>
          </>
        )}
      </div>
    </div>
  );
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <FormCard time={timeCasa} forma={formaCasa} desfalques={desfalquesCasa} lado="casa" />
      <FormCard time={timeFora} forma={formaFora} desfalques={desfalquesFora} lado="fora" />
    </div>
  );
}

function FormCard({
  time, forma, desfalques, lado,
}: {
  time: string; forma: Record<string, any>; desfalques: string[]; lado: 'casa' | 'fora';
}) {
  const ppgLabel = lado === 'casa' ? 'PPG casa' : 'PPG fora';
  const ppg = lado === 'casa' ? forma.ppg_casa : forma.ppg_fora;

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-zinc-200 text-sm font-semibold">{time}</h4>
        {forma.ultimos_jogos && (
          <span className="text-xs font-mono tracking-wider">
            {forma.ultimos_jogos.split('').map((c: string, i: number) => (
              <span
                key={i}
                className={
                  c === 'W' ? 'text-green-500' :
                  c === 'D' ? 'text-yellow-500' :
                  c === 'L' ? 'text-red-500' : 'text-zinc-600'
                }
              >
                {c}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-zinc-800/40 rounded p-2 text-center">
          <div className="text-zinc-500">{ppgLabel}</div>
          <div className="text-zinc-200 font-mono font-bold">{ppg ?? '-'}</div>
        </div>
        <div className="bg-zinc-800/40 rounded p-2 text-center">
          <div className="text-zinc-500">Gols marcados</div>
          <div className="text-green-400 font-mono font-bold">
            {lado === 'casa' ? forma.gols_marcados_casa ?? forma.gols_marcados_fora ?? '-' : forma.gols_marcados_fora ?? forma.gols_marcados_casa ?? '-'}
          </div>
        </div>
        <div className="bg-zinc-800/40 rounded p-2 text-center">
          <div className="text-zinc-500">Gols sofridos</div>
          <div className="text-red-400 font-mono font-bold">
            {lado === 'casa' ? forma.gols_sofridos_casa ?? forma.gols_sofridos_fora ?? '-' : forma.gols_sofridos_fora ?? forma.gols_sofridos_casa ?? '-'}
          </div>
        </div>
      </div>

      {forma.clean_sheets != null && (
        <div className="mt-2 text-xs text-zinc-500">
          Clean sheets: <span className="text-zinc-300 font-mono">{forma.clean_sheets}</span>
        </div>
      )}

      {desfalques.length > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-800/50 text-xs">
          <span className="text-red-400">Desfalques:</span>{' '}
          <span className="text-zinc-500">{desfalques.join(', ')}</span>
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
  // Only render if at least one side has data
  if (!formaCasa || Object.keys(formaCasa).length === 0) return null;

  const stats: Array<{
    label: string; casa: number | null; fora: number | null; format?: 'float' | 'int' | 'pct';
  }> = [
    { label: 'Gols marcados (casa/fora)', casa: formaCasa.gols_marcados_casa, fora: formaFora.gols_marcados_fora, format: 'int' },
    { label: 'Gols sofridos (casa/fora)', casa: formaCasa.gols_sofridos_casa, fora: formaFora.gols_sofridos_fora, format: 'int' },
    { label: 'xG por jogo', casa: formaCasa.avg_xg, fora: formaFora.avg_xg, format: 'float' },
    { label: 'xG sofrido p/jogo', casa: formaCasa.avg_xg_conceded, fora: formaFora.avg_xg_conceded, format: 'float' },
    { label: 'Chutes por jogo', casa: formaCasa.avg_shots, fora: formaFora.avg_shots, format: 'float' },
    { label: 'Chutes no gol p/j', casa: formaCasa.avg_shots_on_target, fora: formaFora.avg_shots_on_target, format: 'float' },
    { label: 'Passes-chave p/j', casa: formaCasa.avg_key_passes, fora: formaFora.avg_key_passes, format: 'float' },
    { label: 'Faltas por jogo', casa: formaCasa.avg_fouls, fora: formaFora.avg_fouls, format: 'float' },
    { label: 'Cartões amarelos p/j', casa: formaCasa.avg_yellow_cards, fora: formaFora.avg_yellow_cards, format: 'float' },
    { label: 'Cartões vermelhos p/j', casa: formaCasa.avg_red_cards, fora: formaFora.avg_red_cards, format: 'float' },
    { label: 'Clean sheets', casa: formaCasa.clean_sheets, fora: formaFora.clean_sheets, format: 'int' },
    { label: 'Rating', casa: formaCasa.avg_team_rating, fora: formaFora.avg_team_rating, format: 'float' },
  ];

  const hasData = stats.some((s) => s.casa != null || s.fora != null);
  if (!hasData) return null;

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <SectionTitle titulo="Estatísticas" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left text-zinc-600 font-medium px-4 py-2">{timeCasa}</th>
              <th className="text-center text-zinc-600 font-medium px-3 py-2 w-16">Média</th>
              <th className="text-right text-zinc-600 font-medium px-4 py-2">{timeFora}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              if (s.casa == null && s.fora == null) return null;
              return (
                <tr key={s.label} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                  <td className="px-4 py-2.5">
                    <span className="text-zinc-300">{formatStat(s.casa, s.format)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-zinc-500">{s.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-zinc-300">{formatStat(s.fora, s.format)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-4">
      <SectionTitle titulo="Confronto Direto" />

      <div className="grid grid-cols-4 gap-3 mb-4 text-center text-xs">
        <div className="bg-zinc-800/40 rounded p-2">
          <div className="text-zinc-500">Total</div>
          <div className="text-zinc-200 font-mono font-bold">{h2h.total_jogos}</div>
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
        <div className="text-xs text-zinc-500 mb-3">
          Média de gols no confronto: <span className="text-zinc-300 font-mono">{h2h.media_gols}</span>
        </div>
      )}

      {ultimos.length > 0 && (
        <div>
          <div className="text-xs text-zinc-600 font-semibold mb-2">Últimos confrontos:</div>
          <div className="space-y-1">
            {ultimos.map((m: H2HMatch, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs bg-zinc-800/30 rounded px-3 py-1.5">
                <span className="text-zinc-300">
                  {m.home_team} {m.home_score ?? '?'} - {m.away_score ?? '?'} {m.away_team}
                </span>
                {m.event_date && (
                  <span className="text-zinc-600">{formatarDataCurta(m.event_date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

  // Show top 6 + casa + fora (deduped)
  const destacarTimes = new Set<string>();
  if (casaRow) destacarTimes.add(casaRow.time);
  if (foraRow) destacarTimes.add(foraRow.time);

  const linhasVisiveis = tabela.filter((r) => r.posicao <= 6 || destacarTimes.has(r.time));

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <SectionTitle titulo="Classificação" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left text-zinc-600 font-medium px-3 py-2 w-8">#</th>
              <th className="text-left text-zinc-600 font-medium px-3 py-2">Time</th>
              <th className="text-center text-zinc-600 font-medium px-2 py-2 w-8">P</th>
              <th className="text-center text-zinc-600 font-medium px-2 py-2 w-8">J</th>
              <th className="text-center text-zinc-600 font-medium px-2 py-2 w-8">V</th>
              <th className="text-center text-zinc-600 font-medium px-2 py-2 w-8">E</th>
              <th className="text-center text-zinc-600 font-medium px-2 py-2 w-8">D</th>
              <th className="text-center text-zinc-600 font-medium px-2 py-2 w-10">SG</th>
              <th className="text-center text-zinc-600 font-medium px-2 py-2 w-12">F. Rec</th>
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
                  className={`border-b border-zinc-800/30 hover:bg-zinc-800/20 ${
                    destaque ? 'bg-orange-500/5' : ''
                  }`}
                >
                  <td className={`px-3 py-2 font-mono ${destaque ? 'text-orange-400' : 'text-zinc-500'}`}>
                    {row.posicao}
                  </td>
                  <td className={`px-3 py-2 ${destaque ? 'text-orange-300 font-medium' : 'text-zinc-300'}`}>
                    {row.time}
                  </td>
                  <td className="text-center px-2 py-2 font-mono font-bold text-zinc-200">{row.pontos}</td>
                  <td className="text-center px-2 py-2 font-mono text-zinc-400">{row.jogos}</td>
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
                            c === 'L' ? 'text-red-500' : 'text-zinc-600'
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
    </div>
  );
}

// ── COACHES ──

function CoachesSection({
  timeCasa, timeFora, tecnicoCasa, tecnicoFora,
}: {
  timeCasa: string; timeFora: string;
  tecnicoCasa: CoachData | null; tecnicoFora: CoachData | null;
}) {
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-4">
      <SectionTitle titulo="Técnicos" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tecnicoCasa && <CoachCard time={timeCasa} coach={tecnicoCasa} />}
        {tecnicoFora && <CoachCard time={timeFora} coach={tecnicoFora} />}
      </div>
    </div>
  );
}

function CoachCard({ time, coach }: { time: string; coach: CoachData }) {
  if (!coach?.nome) return null;

  return (
    <div className="bg-zinc-800/30 rounded-lg p-3">
      <div className="text-zinc-200 text-sm font-medium mb-2">{coach.nome}</div>
      <div className="space-y-1 text-xs">
        {coach.formacao_preferida && (
          <div className="flex justify-between">
            <span className="text-zinc-600">Formação</span>
            <span className="text-zinc-300 font-mono">{coach.formacao_preferida}</span>
          </div>
        )}
        {coach.pressing_intensity != null && (
          <div className="flex justify-between">
            <span className="text-zinc-600">Pressão</span>
            <span className="text-zinc-300 font-mono">{(coach.pressing_intensity * 100).toFixed(0)}%</span>
          </div>
        )}
        {coach.defensive_line && (
          <div className="flex justify-between">
            <span className="text-zinc-600">Linha defensiva</span>
            <span className="text-zinc-300">{coach.defensive_line}</span>
          </div>
        )}
        {coach.top_styles && coach.top_styles.length > 0 && (
          <div className="flex justify-between">
            <span className="text-zinc-600">Estilo</span>
            <span className="text-zinc-300 text-right max-w-[200px]">{coach.top_styles.slice(0, 3).join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── REFEREE ──

function RefereeSection({ arbitro }: { arbitro: Record<string, any> }) {
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-4">
      <SectionTitle titulo="Árbitro" />
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <span className="text-zinc-300 font-medium">{arbitro.nome}</span>
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
    </div>
  );
}

// ── MARKET ODDS COMPARISON ──

function MarketOddsSection({ oddsMercado }: { oddsMercado: Record<string, any> }) {
  const mercados = Object.entries(oddsMercado);

  if (mercados.length === 0) return null;

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-4">
      <SectionTitle titulo="Odds do Mercado (Comparativo)" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-zinc-600 font-medium px-3 py-2">Mercado</th>
              <th className="text-left text-zinc-600 font-medium px-3 py-2">Resultado</th>
              <th className="text-right text-zinc-600 font-medium px-3 py-2">Melhor Odd</th>
              <th className="text-right text-zinc-600 font-medium px-3 py-2">Casa</th>
              <th className="text-right text-zinc-600 font-medium px-3 py-2">Pinnacle</th>
            </tr>
          </thead>
          <tbody>
            {mercados.flatMap(([mercado, outcomes]) =>
              Object.entries(outcomes).map(([outcome, data]: [string, any]) => (
                <tr key={`${mercado}-${outcome}`} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                  <td className="px-3 py-2 text-zinc-400 font-medium">{mercado}</td>
                  <td className="px-3 py-2 text-zinc-300">{outcome}</td>
                  <td className="px-3 py-2 text-right text-orange-400 font-mono font-bold">
                    {data.melhor_odd ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-400 font-mono">
                    {data.melhor_casa ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-300 font-mono">
                    {data.pinnacle_odd ?? '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
