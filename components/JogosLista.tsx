'use client';

import { useState, useEffect } from 'react';
import LoadingIndicator from './LoadingIndicator';

interface Jogo {
  event_id: number;
  data: string;
  liga: string;
  time_casa: string;
  time_fora: string;
  odd_casa: number | null;
  odd_empate: number | null;
  odd_fora: number | null;
  pais: string;
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

  // Agrupa por data
  const grupos = new Map<string, Jogo[]>();
  filtrados.forEach((jogo) => {
    const data = jogo.data?.split('T')[0] || 'sem data';
    if (!grupos.has(data)) grupos.set(data, []);
    grupos.get(data)!.push(jogo);
  });

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

      {/* Lista por data */}
      {Array.from(grupos.entries()).map(([data, jogosData]) => (
        <div key={data} className="mb-8">
          <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
            {formatarData(data)}
          </h3>
          <div className="space-y-2">
            {jogosData.map((jogo) => (
              <button
                key={jogo.event_id}
                onClick={() => onSelectJogo(jogo.event_id)}
                className="w-full bg-[#111111] border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-400 text-xs mb-1.5">
                      {jogo.liga}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-zinc-100 font-medium truncate group-hover:text-orange-400 transition-colors">
                        {jogo.time_casa}
                      </span>
                      <span className="text-zinc-600 text-xs">vs</span>
                      <span className="text-zinc-100 font-medium truncate group-hover:text-orange-400 transition-colors">
                        {jogo.time_fora}
                      </span>
                    </div>
                    <div className="text-zinc-600 text-xs mt-1">
                      {jogo.data?.split('T')[1]?.slice(0, 5) || ''}
                    </div>
                  </div>
                  {/* Odds resumidas */}
                  <div className="ml-4 flex gap-2 text-xs">
                    {jogo.odd_casa && (
                      <div className="bg-zinc-800/60 rounded px-2 py-1 text-center min-w-[40px]">
                        <div className="text-zinc-500 mb-0.5">1</div>
                        <div className="text-zinc-200 font-mono">{jogo.odd_casa}</div>
                      </div>
                    )}
                    {jogo.odd_empate && (
                      <div className="bg-zinc-800/60 rounded px-2 py-1 text-center min-w-[40px]">
                        <div className="text-zinc-500 mb-0.5">X</div>
                        <div className="text-zinc-200 font-mono">{jogo.odd_empate}</div>
                      </div>
                    )}
                    {jogo.odd_fora && (
                      <div className="bg-zinc-800/60 rounded px-2 py-1 text-center min-w-[40px]">
                        <div className="text-zinc-500 mb-0.5">2</div>
                        <div className="text-zinc-200 font-mono">{jogo.odd_fora}</div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatarData(dataStr: string): string {
  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  if (dataStr === hoje) return '📅 Hoje';
  if (dataStr === amanha) return '📅 Amanhã';

  const d = new Date(dataStr + 'T12:00:00');
  return `📅 ${d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
}
