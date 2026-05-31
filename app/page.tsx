'use client';

import { useState, useRef, useEffect } from 'react';
import JogosLista from '@/components/JogosLista';
import DashboardJogo from '@/components/DashboardJogo';
import ChatInterface from '@/components/ChatInterface';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Home() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [timeCasa, setTimeCasa] = useState('');
  const [timeFora, setTimeFora] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  function handleSelectJogo(eventId: number) {
    setSelectedEventId(eventId);
    setShowChat(false);
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

  function handleBack() {
    setSelectedEventId(null);
    setShowChat(false);
  }

  function scrollToChat() {
    setShowChat(true);
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  return (
    <div className="min-h-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
      {!selectedEventId ? (
        <>
          <header className="py-5 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <span className="text-white text-sm font-black font-heading">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold font-heading tracking-tight">
                  <span className="text-gradient">Agente Analista</span>
                </h1>
                <p className="text-muted-foreground text-[10px] font-medium tracking-wide">
                  Odds justas · Estatísticas · Análise IA
                </p>
              </div>
            </div>
          </header>

          <main>
            <ErrorBoundary>
              <JogosLista onSelectJogo={handleSelectJogo} />
            </ErrorBoundary>
          </main>
        </>
      ) : (
        <>
          <div ref={detailsRef}>
            <header className="sticky top-0 z-20 pt-3 pb-2 mb-3" style={{ background: 'var(--background)' }}>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Voltar
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[160px]">
                    {timeCasa} × {timeFora}
                  </span>
                </div>
              </div>
            </header>

            <main className="space-y-4 pb-6">
              <ErrorBoundary>
                <DashboardJogo eventId={selectedEventId} />
              </ErrorBoundary>

              <div className="pt-2">
                <button
                  onClick={scrollToChat}
                  className="w-full glass rounded-xl p-4 flex items-center justify-between group cursor-pointer transition-all duration-200 hover:border-orange-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm">💬</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        Análise IA
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Pergunte sobre o jogo, odds ou estatísticas
                      </p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-primary transition-colors"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>

              {showChat && (
                <div ref={chatRef} className="glass rounded-xl overflow-hidden animate-fade-up">
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
          </div>
        </>
      )}

      <footer className="py-4 text-center text-[10px] text-muted-foreground border-t border-border mt-6">
        Dados via <span className="text-primary/60 font-medium">BSD</span> · IA via OpenRouter
      </footer>
    </div>
  );
}
