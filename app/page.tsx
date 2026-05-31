'use client';

import { useState } from 'react';
import JogosLista from '@/components/JogosLista';
import DashboardJogo from '@/components/DashboardJogo';
import ChatInterface from '@/components/ChatInterface';
import ErrorBoundary from '@/components/ErrorBoundary';

type TabType = 'dashboard' | 'chat';

export default function Home() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [timeCasa, setTimeCasa] = useState('');
  const [timeFora, setTimeFora] = useState('');

  function handleSelectJogo(eventId: number) {
    setSelectedEventId(eventId);
    // Busca info do jogo pelo dashboard
    fetch(`/api/dashboard/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.jogo) {
          setTimeCasa(data.jogo.time_casa);
          setTimeFora(data.jogo.time_fora);
        }
      })
      .catch(() => {});
  }

  return (
    <div className="min-h-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Agente Analista
              </span>
              <span className="ml-2">⚽</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-1 font-medium tracking-wide">
              Odds justas · Estatísticas · IA Especialista
            </p>
          </div>
        </div>
        {/* Subtle separator */}
        <div className="mt-4 h-px bg-gradient-to-r from-orange-500/30 via-zinc-700 to-transparent" />
      </header>

      {/* Tela de seleção vs detalhes */}
      {!selectedEventId ? (
        <main>
          <div className="mb-6">
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Jogos do Dia + Próximos 7 Dias
            </h2>
          </div>
          <ErrorBoundary>
            <JogosLista onSelectJogo={handleSelectJogo} />
          </ErrorBoundary>
        </main>
      ) : (
        <main>
          {/* Botão voltar */}
          <button
            onClick={() => {
              setSelectedEventId(null);
              setTab('dashboard');
            }}
            className="text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors inline-flex items-center gap-1"
          >
            ← Voltar para jogos
          </button>

          {/* Abas */}
          <div className="flex gap-1 mb-4 bg-card rounded-lg p-1 border border-border w-fit">
            <button
              onClick={() => setTab('dashboard')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                tab === 'dashboard'
                  ? 'bg-orange-500 text-white font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setTab('chat')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                tab === 'chat'
                  ? 'bg-orange-500 text-white font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              💬 Chat
            </button>
          </div>

          {/* Conteúdo */}
          {tab === 'dashboard' ? (
            <ErrorBoundary>
              <DashboardJogo eventId={selectedEventId} />
            </ErrorBoundary>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4">
              <ErrorBoundary>
                <ChatInterface
                  eventId={selectedEventId}
                  timeCasa={timeCasa}
                  timeFora={timeFora}
                />
              </ErrorBoundary>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <span>Dados via <span className="text-orange-500/60">BSD</span> · IA via OpenRouter</span>
      </footer>
    </div>
  );
}
