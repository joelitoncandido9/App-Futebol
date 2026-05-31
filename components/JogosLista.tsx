'use client';

import { useState, useEffect } from 'react';
import LoadingIndicator from './LoadingIndicator';

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

export default function JogosLista({ onSelectJogo }: JogosListaProps) {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [ligaFiltro, setLigaFiltro] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

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
  const statusAoVivo = ['inprogress', '1st_half', 'halftime', '2nd_half', 'penalties', 'extratime'];
  const jogosAoVivo = filtrados.filter((j) =>
    statusAoVivo.includes(j.status || '')
  );
  const jogosFinalizados = filtrados.filter((j) => j.status === 'finished');
  const jogosNaoIniciados = filtrados.filter((j) => j.status === 'notstarted' || j.status === 'postponed');
  const outrosStatus = filtrados.filter((j) =>
    ![...statusAoVivo, 'finished', 'notstarted', 'postponed'].includes(j.status || '')
  );

  // Data de hoje pra exibição
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  
  // Próximos 7 dias para abas
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasAba: { date: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const diaSem = diasSemana[d.getDay()];
    const diaNum = d.toLocaleDateString('pt-BR', { day: 'numeric' });
    if (i === 0) diasAba.push({ date: dateStr, label: 'Hoje' });
    else diasAba.push({ date: dateStr, label: `${diaSem} ${diaNum}` });
  }
  
  // Filtra jogos por dia selecionado
  const jogosDoDia = diaSelecionado
    ? jogosNaoIniciados.filter(j => j.data?.startsWith(diaSelecionado))
    : jogosNaoIniciados;

  // Agrupa não-iniciados por data
  const gruposData = new Map<string, Jogo[]>();
  jogosDoDia.forEach((jogo) => {
    const data = jogo.data?.split('T')[0] || 'sem data';
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

  if (loading) return <LoadingIndicator mensagem="Buscando jogos..." />;

  if (erro) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">{erro}</p>
        <button
          onClick={() => window.location.reload()}
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
          onChange={(e) => setPesquisa(e.target.value)}
          className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-foreground/80 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors"
        />
        <select
          value={ligaFiltro}
          onChange={(e) => setLigaFiltro(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-foreground/80 text-sm focus:outline-none focus:border-orange-500/50 transition-colors sm:max-w-[180px] w-full"
        >
          <option value="">Todas ligas</option>
          {ligas.map((liga) => (
            <option key={liga} value={liga}>{liga}</option>
          ))}
        </select>
      </div>

      {/* ── ABAS DE DIAS ── */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {diasAba.map((dia) => (
          <button
            key={dia.date}
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
        <div className="mb-10">
          <h2 className="text-green-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ⏳ Ao Vivo
            <span className="text-muted-foreground font-normal">({jogosAoVivo.length})</span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosAoVivo), onSelectJogo, true)}
        </div>
      )}

      {/* ── FINALIZADOS (só hoje) ── */}
      {jogosFinalizados.filter(j => j.data?.startsWith(hoje)).length > 0 && (
        <div className="mb-10">
          <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            ✅ Finalizados Hoje
            <span className="text-muted-foreground font-normal">({jogosFinalizados.filter(j => j.data?.startsWith(hoje)).length})</span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosFinalizados.filter(j => j.data?.startsWith(hoje))), onSelectJogo, false, true)}
        </div>
      )}

      {/* ── PRÓXIMOS JOGOS (não iniciados, por data) ── */}
      {jogosDoDia.length > 0 && (
        <div className="mb-10">
          <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-4">
            📅 Próximos Jogos ({jogosDoDia.length})
          </h2>
          <div className="space-y-8">
            {Array.from(gruposData.entries()).map(([data, jogosData]) => (
              <div key={data}>
                <h3 className="text-muted-foreground text-xs font-semibold mb-3">
                  {data === hoje ? 'Hoje' : formatarData(data)}
                  <span className="text-zinc-700 ml-1">({jogosData.length})</span>
                </h3>
                {renderGrupos(agruparPorLiga(jogosData), onSelectJogo)}
              </div>
            ))}
          </div>
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
            className="w-full bg-card border border-border hover:border-gray-300 rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer glow-accent"
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

function formatarHora(dataStr: string): string {
  try {
    const d = new Date(dataStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatarData(dataStr: string): string {
  try {
    const d = new Date(dataStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return dataStr;
  }
}
