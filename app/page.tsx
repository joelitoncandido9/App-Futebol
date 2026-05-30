'use client';

import { useState } from 'react';
import JogosLista from '@/components/JogosLista';
import DashboardJogo from '@/components/DashboardJogo';
import ChatInterface from '@/components/ChatInterface';

type TabType = 'dashboard' | 'chat';

export default function Home() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [timeCasa, setTimeCasa] = useState('');
  const [timeFora, setTimeFora] = useState('');

  function handleSelectJogo(eventId: number) {
    setSelectedEventId(eventId);
    // Busca info básica do jogo para passar pro chat
    fetch(`/api/jogos?event_id=${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        const jogo = data.jogos?.[0];
        if (jogo) {
          setTimeCasa(jogo.time_casa);
          setTimeFora(jogo.time_fora);
        }
      })
      .catch(() => {});
  }

  return (
    <div className="min-h-full max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              Agente Analista <span className="text-orange-500">⚽</span>
            </h1>
            <p className="text-zinc-600 text-xs mt-0.5">
              Odds justas estatísticas + Especialista IA
            </p>
          </div>
        </div>
      </header>

      {/* Tela de seleção vs detalhes */}
      {!selectedEventId ? (
        <main>
          <div className="mb-6">
            <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Jogos do Dia + Próximos 7 Dias
            </h2>
          </div>
          <JogosLista onSelectJogo={handleSelectJogo} />
        </main>
      ) : (
        <main>
          {/* Botão voltar */}
          <button
            onClick={() => {
              setSelectedEventId(null);
              setTab('dashboard');
            }}
            className="text-zinc-500 hover:text-zinc-300 text-sm mb-4 transition-colors inline-flex items-center gap-1"
          >
            ← Voltar para jogos
          </button>

          {/* Abas */}
          <div className="flex gap-1 mb-4 bg-[#111111] rounded-lg p-1 border border-zinc-800 w-fit">
            <button
              onClick={() => setTab('dashboard')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                tab === 'dashboard'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setTab('chat')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                tab === 'chat'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              💬 Chat
            </button>
          </div>

          {/* Conteúdo */}
          {tab === 'dashboard' ? (
            <DashboardJogo eventId={selectedEventId} />
          ) : (
            <div className="bg-[#111111] border border-zinc-800 rounded-lg p-4">
              <ChatInterface
                eventId={selectedEventId}
                timeCasa={timeCasa}
                timeFora={timeFora}
              />
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-zinc-800/50 text-center text-xs text-zinc-700">
        Dados via BSD API • IA via OpenRouter (gpt-oss-120b)
      </footer>
    </div>
  );
}
