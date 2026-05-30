'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  eventId?: number;
  timeCasa?: string;
  timeFora?: string;
}

const EXEMPLOS = [
  'Analisa o contexto desse jogo',
  'Qual time tem mais chance de vencer?',
  'Quais os principais riscos dessa partida?',
  'Minha banca é R$500. Tem algum palpite?',
];

export default function ChatInterface({ eventId, timeCasa, timeFora }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState('');
  const [streaming, setStreaming] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, streaming, toolStatus]);

  async function enviar(conteudo: string) {
    if (!conteudo.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: conteudo.trim() };
    const novasMsgs = [...messages, userMsg];
    setMessages(novasMsgs);
    setInput('');
    setLoading(true);
    setStreaming('');
    setToolStatus('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: conteudo.trim() }], eventId }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Sem stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let resposta = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const evento = JSON.parse(trimmed.slice(6));
            if (evento.type === 'tool') {
              setToolStatus(evento.message);
            } else if (evento.type === 'text') {
              resposta += evento.content;
              setStreaming(resposta);
            } else if (evento.type === 'done') {
              // Finalizado
            } else if (evento.type === 'error') {
              setToolStatus(`⚠️ ${evento.content}`);
            }
          } catch { /* ignora */ }
        }
      }

      if (resposta) {
        setMessages((prev) => [...prev, { role: 'assistant', content: resposta }]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ Erro: ${err.message}. Tente novamente.` },
        ]);
      }
    } finally {
      setLoading(false);
      setStreaming('');
      setToolStatus('');
      abortRef.current = null;
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-orange-500">💬</span>
          <h3 className="text-foreground/80 text-sm font-medium">
            Especialista
            {timeCasa && timeFora && (
              <span className="text-muted-foreground font-normal ml-1">{timeCasa} x {timeFora}</span>
            )}
          </h3>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setStreaming(''); }}
            className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin"
      >
        {/* Exemplos iniciais */}
        {messages.length === 0 && !loading && (
          <div className="space-y-2 py-4">
            <p className="text-muted-foreground text-xs text-center mb-3">
              Pergunte ao especialista sobre o jogo:
            </p>
            {EXEMPLOS.map((ex) => (
              <button
                key={ex}
                onClick={() => enviar(ex)}
                className="block w-full text-left text-xs text-muted-foreground bg-card border border-border hover:border-zinc-700 rounded-lg px-3 py-2 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-orange-500/10 border border-orange-500/20 text-foreground'
                  : 'bg-card border border-border text-foreground/80'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming em andamento */}
        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-card border border-border rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
              {streaming}
              <span className="inline-block w-2 h-4 bg-orange-500/60 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Tool status */}
        {toolStatus && !streaming && (
          <div className="flex justify-start">
            <div className="text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
              {toolStatus}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar(input);
            }
          }}
          placeholder="Pergunte sobre o jogo..."
          disabled={loading}
          className="flex-1 bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 placeholder-gray-400 focus:outline-none focus:border-orange-500/50 disabled:opacity-50"
        />
        <button
          onClick={() => enviar(input)}
          disabled={loading || !input.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-muted-foreground text-black font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
