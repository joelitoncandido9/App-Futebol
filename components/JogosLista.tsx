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

const ITENS_POR_PAGINA = 8;

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

  const ligas = [...new Set(jogos.map((j) => j.liga).filter(Boolean))].sort();

  const filtrados = jogos.filter((j) => {
    const matchPesquisa = !pesquisa ||
      j.time_casa.toLowerCase().includes(pesquisa.toLowerCase()) ||
      j.time_fora.toLowerCase().includes(pesquisa.toLowerCase()) ||
      j.liga.toLowerCase().includes(pesquisa.toLowerCase());
    const matchLiga = !ligaFiltro || j.liga === ligaFiltro;
    return matchPesquisa && matchLiga;
  });

  const agora = new Date();
  const statusAoVivo = ['inprogress', '1st_half', 'halftime', '2nd_half', 'penalties', 'extratime'];
  const jogosAoVivo = filtrados.filter((j) =>
    statusAoVivo.includes(j.status || '')
  );
  const jogosFinalizados = filtrados.filter((j) => j.status === 'finished');

  function jogoJaAconteceu(j: Jogo): boolean {
    if (!j.data) return false;
    const dataJogo = new Date(j.data).getTime();
    if (isNaN(dataJogo)) return false;
    return dataJogo < Date.now();
  }

  const jogosNaoIniciados = filtrados.filter((j) =>
    (j.status === 'notstarted' || j.status === 'postponed') && !jogoJaAconteceu(j)
  );
  const jogosPassadosSemResultado = filtrados.filter((j) => {
    if (j.status !== 'notstarted') return false;
    return jogoJaAconteceu(j);
  });
  const outrosStatus = filtrados.filter((j) =>
    ![...statusAoVivo, 'finished', 'notstarted', 'postponed'].includes(j.status || '')
  );

  const fmtBRT = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });

  function converterParaBRT(dataStr: string): string {
    try {
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) throw new Error('inválida');
      return fmtBRT.format(d);
    } catch {
      const match = dataStr?.match(/^(\d{4}-\d{2}-\d{2})/);
      return match?.[1] || 'sem data';
    }
  }

  const hoje = fmtBRT.format(new Date());

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

  const jogosDoDia = diaSelecionado
    ? jogosNaoIniciados.filter(j => converterParaBRT(j.data) === diaSelecionado)
    : jogosNaoIniciados;

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
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">⚠️</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{erro}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-primary font-medium hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          type="text"
          placeholder="Buscar time ou liga..."
          value={pesquisa}
          onChange={(e) => { setPesquisa(e.target.value); setPaginaAtual(0); }}
          className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground/80 placeholder-zinc-500 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        {ligaFiltro && (
          <button
            onClick={() => setLigaFiltro('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {ligas.length > 0 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setLigaFiltro('')}
            className={`shrink-0 px-2.5 py-1 text-[10px] rounded-lg font-medium transition-all whitespace-nowrap ${
              !ligaFiltro
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas
          </button>
          {ligas.slice(0, 6).map((liga) => (
            <button
              key={liga}
              onClick={() => setLigaFiltro(liga === ligaFiltro ? '' : liga)}
              className={`shrink-0 px-2.5 py-1 text-[10px] rounded-lg font-medium transition-all whitespace-nowrap ${
                ligaFiltro === liga
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {liga}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {diasAba.map((dia) => (
          <button
            key={dia.date}
            onClick={() => setDiaSelecionado(diaSelecionado === dia.date ? null : dia.date)}
            className={`shrink-0 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all font-medium ${
              diaSelecionado === dia.date
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'glass text-muted-foreground hover:text-foreground'
            }`}
          >
            {dia.label}
          </button>
        ))}
        {diaSelecionado && (
          <button
            onClick={() => setDiaSelecionado(null)}
            className="shrink-0 px-2.5 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">Nenhum jogo encontrado.</p>
        </div>
      )}

      {jogosAoVivo.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Ao Vivo
            <span className="text-muted-foreground font-normal text-[10px]">({jogosAoVivo.length})</span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosAoVivo), onSelectJogo, true)}
        </div>
      )}

      {jogosFinalizados.filter(j => converterParaBRT(j.data) === hoje).length > 0 && (
        <div className="mb-8">
          <h2 className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3">
            Finalizados Hoje
            <span className="text-muted-foreground font-normal text-[10px] ml-1">
              ({jogosFinalizados.filter(j => converterParaBRT(j.data) === hoje).length})
            </span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosFinalizados.filter(j => converterParaBRT(j.data) === hoje)), onSelectJogo, false, true)}
        </div>
      )}

      {jogosPassadosSemResultado.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[11px] text-yellow-500/80 font-bold uppercase tracking-wider mb-3">
            Sem Resultado
            <span className="text-muted-foreground font-normal text-[10px] ml-1">({jogosPassadosSemResultado.length})</span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosPassadosSemResultado), onSelectJogo, false, true)}
        </div>
      )}

      {jogosDoDia.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3">
            Próximos Jogos
            <span className="text-muted-foreground font-normal text-[10px] ml-1">({jogosDoDia.length})</span>
          </h2>
          <div className="space-y-6">
            {Array.from(gruposData.entries())
              .slice(paginaAtual * ITENS_POR_PAGINA, (paginaAtual + 1) * ITENS_POR_PAGINA)
              .map(([data, jogosData]) => (
              <div key={data}>
                <h3 className="text-[10px] text-muted-foreground font-semibold mb-2.5 uppercase tracking-wider">
                  {data === hoje ? 'Hoje' : formatarData(data)}
                  <span className="text-muted-foreground font-normal ml-1">({jogosData.length})</span>
                </h3>
                {renderGrupos(agruparPorLiga(jogosData), onSelectJogo)}
              </div>
            ))}
          </div>
          {gruposData.size > ITENS_POR_PAGINA && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPaginaAtual(Math.max(0, paginaAtual - 1))}
                disabled={paginaAtual === 0}
                className="px-3 py-1.5 text-xs rounded-lg glass text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ←
              </button>
              <span className="text-xs text-muted-foreground">
                {paginaAtual + 1} / {Math.ceil(gruposData.size / ITENS_POR_PAGINA)}
              </span>
              <button
                onClick={() => setPaginaAtual(Math.min(Math.ceil(gruposData.size / ITENS_POR_PAGINA) - 1, paginaAtual + 1))}
                disabled={paginaAtual >= Math.ceil(gruposData.size / ITENS_POR_PAGINA) - 1}
                className="px-3 py-1.5 text-xs rounded-lg glass text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                →
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
    <div key={liga} className="mb-4">
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <span className="text-muted-foreground text-[10px]">🏆</span>
        <h4 className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{liga}</h4>
        <span className="text-muted-foreground/50 text-[9px]">({jogos.length})</span>
      </div>
      <div className="space-y-1.5">
        {jogos.map((jogo, idx) => {
          const temPlacar = (jogo.score_casa != null || jogo.score_fora != null) && (aoVivo || finalizado);
          return (
          <button
            key={jogo.event_id}
            onClick={() => onSelectJogo(jogo.event_id)}
            style={{ animationDelay: `${idx * 60}ms` }}
            className="w-full glass rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] animate-fade-up"
          >
            <div className="p-3">
              <div className="flex items-center gap-3">
                {temPlacar ? (
                  <div className="shrink-0 text-center w-14">
                    <div className={`text-lg font-black font-heading ${aoVivo ? 'text-white' : 'text-muted-foreground'}`}>
                      {jogo.score_casa}-{jogo.score_fora}
                    </div>
                    {aoVivo && (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[6px] text-green-500 uppercase tracking-widest font-bold">AO VIVO</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="shrink-0 text-center w-12">
                    <div className="text-muted-foreground text-[10px] font-mono font-bold tracking-tight">
                      {formatarHora(jogo.data)}
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors truncate">
                    {jogo.time_casa}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight truncate">
                    {jogo.time_fora}
                  </div>
                </div>
                {!aoVivo && !finalizado && (
                  <div className="flex gap-1 shrink-0">
                    {jogo.odd_casa && (
                      <div className="bg-primary/10 rounded-lg px-2 py-1.5 text-center min-w-[36px]">
                        <div className="text-primary font-mono text-[10px] font-bold">{Number(jogo.odd_casa).toFixed(2)}</div>
                      </div>
                    )}
                    {jogo.odd_empate && (
                      <div className="bg-card rounded-lg px-2 py-1.5 text-center min-w-[36px] border border-border/50">
                        <div className="text-foreground/70 font-mono text-[10px]">{Number(jogo.odd_empate).toFixed(2)}</div>
                      </div>
                    )}
                    {jogo.odd_fora && (
                      <div className="bg-blue-500/10 rounded-lg px-2 py-1.5 text-center min-w-[36px]">
                        <div className="text-blue-400 font-mono text-[10px] font-bold">{Number(jogo.odd_fora).toFixed(2)}</div>
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
