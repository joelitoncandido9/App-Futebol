'use client';

import { useState, useEffect } from 'react';
import { formatarHora, formatarData } from '@/lib/utils';
import { SkeletonLista } from './SkeletonCard';

interface Jogo {
  event_id: number;
  data: string;
  liga: string;
  pais: string;
  time_casa: string;
  time_fora: string;
  odd_casa: number | null;
  odd_empate: number | null;
  odd_fora: number | null;
  status?: string;
  score_casa?: number;
  score_fora?: number;
}

interface JogosListaProps {
  onSelectJogo: (eventId: number) => void;
}

const ITENS_POR_PAGINA = 5;

export default function JogosLista({ onSelectJogo }: JogosListaProps) {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [ligaFiltro, setLigaFiltro] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/jogos');
        if (!res.ok) throw new Error('Erro ao carregar');
        const data = await res.json();
        setJogos(data.jogos || []);
      } catch (err: any) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  // Lista única de ligas para o filtro
  const ligas = [...new Set(jogos.map((j) => j.liga).filter(Boolean))].sort();

  // Filtragem por time, liga OU ligaFiltro
  const filtrados = jogos.filter((j) => {
    const matchPesquisa = !pesquisa ||
      j.time_casa.toLowerCase().includes(pesquisa.toLowerCase()) ||
      j.time_fora.toLowerCase().includes(pesquisa.toLowerCase()) ||
      j.liga.toLowerCase().includes(pesquisa.toLowerCase());
    const matchLiga = !ligaFiltro || j.liga === ligaFiltro;
    return matchPesquisa && matchLiga;
  });

  // Separa jogos por status
  const agora = new Date();
  const statusAoVivo = ['inprogress', '1st_half', 'halftime', '2nd_half', 'penalties', 'extratime'];
  const jogosAoVivo = filtrados.filter((j) =>
    statusAoVivo.includes(j.status || '')
  );
  const jogosFinalizados = filtrados.filter((j) => j.status === 'finished');
  // Filtro extra: jogos que já passaram (data+hora < agora), mesmo que a BSD retorne status notstarted
  function jogoJaAconteceu(j: Jogo): boolean {
    if (!j.data) return false;
    const dataJogo = new Date(j.data).getTime();
    if (isNaN(dataJogo)) return false; // data inválida → não filtra
    return dataJogo < Date.now();
  }

  const jogosNaoIniciados = filtrados.filter((j) =>
    (j.status === 'notstarted' || j.status === 'postponed') && !jogoJaAconteceu(j)
  );
  // Jogos notstarted cujo horário já passou (sem resultado na BSD)
  const jogosPassadosSemResultado = filtrados.filter((j) => {
    if (j.status !== 'notstarted') return false;
    return jogoJaAconteceu(j);
  });
  const outrosStatus = filtrados.filter((j) =>
    ![...statusAoVivo, 'finished', 'notstarted', 'postponed'].includes(j.status || '')
  );

  // Converte data ISO (+04:00 da BSD) para YYYY-MM-DD em BRT
  // Instância reutilizável pra consistência
  const fmtBRT = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });

  function converterParaBRT(dataStr: string): string {
    try {
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) throw new Error('inválida');
      return fmtBRT.format(d);
    } catch {
      // Fallback: extrai YYYY-MM-DD do começo da string
      const match = dataStr?.match(/^(\d{4}-\d{2}-\d{2})/);
      return match?.[1] || 'sem data';
    }
  }

  // Data de hoje em BRT — mesmo formatador usado pros jogos
  const hoje = fmtBRT.format(new Date());

  // Próximos 7 dias para abas
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasAba: { date: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = fmtBRT.format(d);
    const diaSem = diasSemana[d.getDay()];
    const diaNum = d.toLocaleDateString('pt-BR', { day: 'numeric' });
    if (i === 0) diasAba.push({ date: dateStr, label: 'Hoje' });
    else diasAba.push({ date: dateStr, label: `${diaSem} ${diaNum}` });
  }
  
  // Filtra jogos por dia selecionado (usando data convertida para BRT)
  const jogosDoDia = diaSelecionado
    ? jogosNaoIniciados.filter(j => converterParaBRT(j.data) === diaSelecionado)
    : jogosNaoIniciados;

  // Agrupa não-iniciados por data (em BRT)
  const gruposData = new Map<string, Jogo[]>();
  jogosDoDia.forEach((jogo) => {
    const data = converterParaBRT(jogo.data);
    if (!gruposData.has(data)) gruposData.set(data, []);
    gruposData.get(data)!.push(jogo);
  });

  function agruparPorLiga(jogos: Jogo[]): Map<string, Jogo[]> {
    const mapa = new Map<string, Jogo[]>();
    jogos.forEach((j) => {
      const liga = j.liga || 'Outros';
      if (!mapa.has(liga)) mapa.set(liga, []);
      mapa.get(liga)!.push(j);
    });
    return mapa;
  }

  if (loading) return <SkeletonLista />;

  if (erro) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">{erro}</p>
        <button
          onClick={() => window.location.reload()}
          aria-label="Tentar carregar jogos novamente"
          className="mt-3 text-orange-500 text-sm hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Busca + Filtro Liga */}
      <div className="mb-6 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Buscar por time ou liga..."
          value={pesquisa}
          onChange={(e) => { setPesquisa(e.target.value); setPaginaAtual(0); }}
          aria-label="Buscar jogos por time ou liga"
          className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-foreground/80 placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors"
        />
        <select
          value={ligaFiltro}
          onChange={(e) => { setLigaFiltro(e.target.value); setPaginaAtual(0); }}
          aria-label="Filtrar por liga"
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-foreground/80 text-sm focus:outline-none focus:border-orange-500/50 transition-colors sm:max-w-[180px] w-full"
        >
          <option value="">Todas ligas</option>
          {ligas.map((liga) => (
            <option key={liga} value={liga}>{liga}</option>
          ))}
        </select>
      </div>

      {/* ── ABAS DE DIAS ── */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Filtro por dia">
        {diasAba.map((dia) => (
          <button
            key={dia.date}
            role="tab"
            aria-selected={diaSelecionado === dia.date}
            onClick={() => setDiaSelecionado(diaSelecionado === dia.date ? null : dia.date)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors font-medium ${
              diaSelecionado === dia.date
                ? 'bg-orange-500 text-white font-semibold'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-zinc-600'
            }`}
          >
            {dia.label}
          </button>
        ))}
        {diaSelecionado && (
          <button
            onClick={() => setDiaSelecionado(null)}
            aria-label="Limpar filtro de dia"
            className="px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum jogo encontrado nos próximos 7 dias.</p>
        </div>
      )}

      {/* ── AO VIVO ── */}
      {jogosAoVivo.length > 0 && (
        <div className="mb-10" role="region" aria-label="Jogos ao vivo">
          <h2 className="text-green-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ⏳ Ao Vivo
            <span className="text-muted-foreground font-normal">({jogosAoVivo.length})</span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosAoVivo), onSelectJogo, true)}
        </div>
      )}

      {/* ── FINALIZADOS (só hoje, em BRT) ── */}
      {jogosFinalizados.filter(j => converterParaBRT(j.data) === hoje).length > 0 && (
        <div className="mb-10" role="region" aria-label="Jogos finalizados hoje">
          <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            ✅ Finalizados Hoje
            <span className="text-muted-foreground font-normal">({jogosFinalizados.filter(j => converterParaBRT(j.data) === hoje).length})</span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosFinalizados.filter(j => converterParaBRT(j.data) === hoje)), onSelectJogo, false, true)}
        </div>
      )}

      {/* ── SEM RESULTADO (notstarted mas já ocorridos) ── */}
      {jogosPassadosSemResultado.length > 0 && (
        <div className="mb-10" role="region" aria-label="Jogos sem resultado disponível">
          <h2 className="text-yellow-500/80 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            ⚠️ Sem Resultado Disponível
            <span className="text-muted-foreground font-normal">({jogosPassadosSemResultado.length})</span>
          </h2>
          <p className="text-muted-foreground text-xs mb-3 -mt-2">
            Jogos já ocorridos sem resultado na base de dados (aguardando atualização da BSD)
          </p>
          {renderGrupos(agruparPorLiga(jogosPassadosSemResultado), onSelectJogo, false, true)}
        </div>
      )}

      {/* ── PRÓXIMOS JOGOS (não iniciados, por data) ── */}
      {jogosDoDia.length > 0 && (
        <div className="mb-10" role="region" aria-label="Próximos jogos">
          <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4">
            📅 Próximos Jogos ({jogosDoDia.length})
          </h2>
          <div className="space-y-8">
            {Array.from(gruposData.entries())
              .slice(paginaAtual * ITENS_POR_PAGINA, (paginaAtual + 1) * ITENS_POR_PAGINA)
              .map(([data, jogosData]) => (
              <div key={data}>
                <h3 className="text-muted-foreground text-xs font-semibold mb-3">
                  {data === hoje ? 'Hoje' : formatarData(data)}
                  <span className="text-zinc-700 ml-1">({jogosData.length})</span>
                </h3>
                {renderGrupos(agruparPorLiga(jogosData), onSelectJogo)}
              </div>
            ))}
          </div>
          {gruposData.size > ITENS_POR_PAGINA && (
            <div className="flex items-center justify-center gap-2 mt-4" aria-label="Paginação">
              <button
                onClick={() => setPaginaAtual(Math.max(0, paginaAtual - 1))}
                disabled={paginaAtual === 0}
                className="px-3 py-1.5 text-xs rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                ← Anterior
              </button>
              <span className="text-xs text-muted-foreground" aria-current="page">
                {paginaAtual + 1} de {Math.ceil(gruposData.size / ITENS_POR_PAGINA)}
              </span>
              <button
                onClick={() => setPaginaAtual(Math.min(Math.ceil(gruposData.size / ITENS_POR_PAGINA) - 1, paginaAtual + 1))}
                disabled={paginaAtual >= Math.ceil(gruposData.size / ITENS_POR_PAGINA) - 1}
                className="px-3 py-1.5 text-xs rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Próxima página"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderGrupos(grupos: Map<string, Jogo[]>, onSelectJogo: (id: number) => void, aoVivo = false, finalizado = false) {
  return Array.from(grupos.entries()).map(([liga, jogos]) => (
    <div key={liga} className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">🏆</span>
        <h4 className="text-muted-foreground text-xs font-semibold">{liga}</h4>
        <span className="text-zinc-700 text-xs">({jogos.length})</span>
      </div>
      <div className="space-y-1.5">
        {jogos.map((jogo) => {
          const temPlacar = (jogo.score_casa != null || jogo.score_fora != null) && (aoVivo || finalizado);
          return (
          <button
            key={jogo.event_id}
            onClick={() => onSelectJogo(jogo.event_id)}
            aria-label={`${jogo.time_casa} vs ${jogo.time_fora}`}
            className="w-full bg-card border border-border hover:border-zinc-600 rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer glow-accent"
          >
            {/* Gradient accent bar */}
            <div className={`h-0.5 w-full bg-gradient-to-r ${aoVivo ? 'from-green-500 via-green-400/50 to-transparent' : finalizado ? 'from-zinc-600/50 via-zinc-500/20 to-transparent' : 'from-orange-500/80 via-orange-400/40 to-transparent'}`} />
            <div className="p-3.5">
            <div className="flex items-start justify-between flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {/* Horário ou Placar */}
                {temPlacar ? (
                  <div className="shrink-0 text-center w-14">
                    <div className={`text-xl font-black ${aoVivo ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {jogo.score_casa}-{jogo.score_fora}
                    </div>
                    {aoVivo && (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[7px] text-green-500 uppercase tracking-[0.15em] font-bold">AO VIVO</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="shrink-0 text-center w-12">
                    <div className="text-muted-foreground text-[11px] font-mono font-bold tracking-tight">
                      {formatarHora(jogo.data)}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-center gap-2.5">
                    <span className={`text-sm font-semibold leading-tight transition-colors group-hover:text-orange-400 ${temPlacar && aoVivo ? 'text-foreground' : 'text-foreground'}`}>
                      {jogo.time_casa}
                    </span>
                    {!temPlacar && (
                      <>
                        <span className="text-muted-foreground text-[10px] font-medium px-2 py-0.5 bg-muted/50 rounded-md">VS</span>
                        <span className="text-sm font-semibold leading-tight group-hover:text-orange-400 transition-colors">
                          {jogo.time_fora}
                        </span>
                      </>
                    )}
                  </div>
                  {temPlacar && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 text-center">
                      {jogo.time_casa} · {jogo.time_fora}
                    </div>
                  )}
                </div>
              </div>
              {/* Odds resumidas (só pra não-iniciados) */}
              {!aoVivo && !finalizado && (
              <div className="flex gap-1.5 sm:gap-2 text-[10px] sm:text-xs shrink-0 self-end sm:self-auto">
                {jogo.odd_casa && (
                  <div className="bg-orange-500/10 rounded-lg px-2 py-1.5 text-center min-w-[40px]">
                    <div className="text-muted-foreground mb-0.5 text-[9px] font-semibold">1</div>
                    <div className="text-orange-400 font-mono text-[12px] font-bold">{Number(jogo.odd_casa).toFixed(2)}</div>
                  </div>
                )}
                {jogo.odd_empate && (
                  <div className="bg-zinc-700/30 rounded-lg px-2 py-1.5 text-center min-w-[40px]">
                    <div className="text-muted-foreground mb-0.5 text-[9px] font-semibold">X</div>
                    <div className="text-foreground/80 font-mono text-[12px]">{Number(jogo.odd_empate).toFixed(2)}</div>
                  </div>
                )}
                {jogo.odd_fora && (
                  <div className="bg-blue-500/10 rounded-lg px-2 py-1.5 text-center min-w-[40px]">
                    <div className="text-muted-foreground mb-0.5 text-[9px] font-semibold">2</div>
                    <div className="text-blue-400 font-mono text-[12px] font-bold">{Number(jogo.odd_fora).toFixed(2)}</div>
                  </div>
                )}
              </div>
              )}
            </div>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  ));
}


