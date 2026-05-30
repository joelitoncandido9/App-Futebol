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
}

interface JogosListaProps {
  onSelectJogo: (eventId: number) => void;
}

export default function JogosLista({ onSelectJogo }: JogosListaProps) {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [pesquisa, setPesquisa] = useState('');

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

  // Filtragem por time ou liga
  const filtrados = pesquisa
    ? jogos.filter(
        (j) =>
          j.time_casa.toLowerCase().includes(pesquisa.toLowerCase()) ||
          j.time_fora.toLowerCase().includes(pesquisa.toLowerCase()) ||
          j.liga.toLowerCase().includes(pesquisa.toLowerCase())
      )
    : jogos;

  // Separa jogos de hoje do restante
  const hoje = new Date().toISOString().split('T')[0];
  const jogosHoje = filtrados.filter((j) => j.data?.startsWith(hoje));
  const jogosOutros = filtrados.filter((j) => !j.data?.startsWith(hoje));

  // Agrupa os "outros" por data
  const gruposData = new Map<string, Jogo[]>();
  jogosOutros.forEach((jogo) => {
    const data = jogo.data?.split('T')[0] || 'sem data';
    if (!gruposData.has(data)) gruposData.set(data, []);
    gruposData.get(data)!.push(jogo);
  });

  // Dentro de cada data, agrupa por liga
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
      {/* Busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por time ou liga..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="w-full bg-[#111111] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 placeholder-zinc-600 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors"
        />
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500">Nenhum jogo encontrado nos próximos 7 dias.</p>
        </div>
      )}

      {/* ── JOGOS DE HOJE ── */}
      {jogosHoje.length > 0 && (
        <div className="mb-10">
          <h2 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Jogos de Hoje
            <span className="text-zinc-600 font-normal">({jogosHoje.length})</span>
          </h2>
          {renderGrupos(agruparPorLiga(jogosHoje), onSelectJogo)}
        </div>
      )}

      {/* ── PRÓXIMOS JOGOS ── */}
      {jogosOutros.length > 0 && (
        <div className="mb-10">
          <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4">
            Próximos Jogos ({jogosOutros.length})
          </h2>
          <div className="space-y-8">
            {Array.from(gruposData.entries()).map(([data, jogosData]) => (
              <div key={data}>
                <h3 className="text-zinc-600 text-xs font-semibold mb-3">
                  {formatarData(data)}
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

function renderGrupos(grupos: Map<string, Jogo[]>, onSelectJogo: (id: number) => void) {
  return Array.from(grupos.entries()).map(([liga, jogos]) => (
    <div key={liga} className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-zinc-600">🏆</span>
        <h4 className="text-zinc-500 text-xs font-semibold">{liga}</h4>
        <span className="text-zinc-700 text-xs">({jogos.length})</span>
      </div>
      <div className="space-y-1.5">
        {jogos.map((jogo) => (
          <button
            key={jogo.event_id}
            onClick={() => onSelectJogo(jogo.event_id)}
            className="w-full bg-[#111111] border border-zinc-800 hover:border-zinc-700 rounded-lg p-3 text-left transition-colors group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className="flex-1 text-right">
                  <span className="text-zinc-100 text-sm font-medium group-hover:text-orange-400 transition-colors">
                    {jogo.time_casa}
                  </span>
                </div>
                <div className="text-zinc-600 text-xs font-medium px-2 py-0.5 bg-zinc-800/50 rounded">vs</div>
                <div className="flex-1 text-left">
                  <span className="text-zinc-100 text-sm font-medium group-hover:text-orange-400 transition-colors">
                    {jogo.time_fora}
                  </span>
                </div>
              </div>
              {/* Odds resumidas */}
              <div className="ml-3 flex gap-1.5 text-xs shrink-0">
                {jogo.odd_casa && (
                  <div className="bg-zinc-800/60 rounded px-1.5 py-1 text-center min-w-[36px]">
                    <div className="text-zinc-600 mb-0.5 text-[10px]">1</div>
                    <div className="text-zinc-200 font-mono text-[11px]">{jogo.odd_casa}</div>
                  </div>
                )}
                {jogo.odd_empate && (
                  <div className="bg-zinc-800/60 rounded px-1.5 py-1 text-center min-w-[36px]">
                    <div className="text-zinc-600 mb-0.5 text-[10px]">X</div>
                    <div className="text-zinc-200 font-mono text-[11px]">{jogo.odd_empate}</div>
                  </div>
                )}
                {jogo.odd_fora && (
                  <div className="bg-zinc-800/60 rounded px-1.5 py-1 text-center min-w-[36px]">
                    <div className="text-zinc-600 mb-0.5 text-[10px]">2</div>
                    <div className="text-zinc-200 font-mono text-[11px]">{jogo.odd_fora}</div>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  ));
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
