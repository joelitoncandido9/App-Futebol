'use client';

import { useState, useEffect } from 'react';
import CardMercado from './CardMercado';
import LoadingIndicator from './LoadingIndicator';

interface DashboardData {
  jogo: {
    event_id: number;
    data: string;
    liga: string;
    time_casa: string;
    time_fora: string;
    status: string;
  };
  odds_consenso: Record<string, number | null>;
  cards_mercado: any[];
  forma_casa: Record<string, any>;
  forma_fora: Record<string, any>;
  h2h: Record<string, any>;
  arbitro: Record<string, any>;
  desfalques_casa: string[];
  desfalques_fora: string[];
}

interface DashboardJogoProps {
  eventId: number;
}

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

  const { jogo, cards_mercado, forma_casa, forma_fora, h2h, arbitro, desfalques_casa, desfalques_fora } = data;

  return (
    <div>
      {/* Cabeçalho do jogo */}
      <div className="mb-6 bg-[#111111] border border-zinc-800 rounded-lg p-5">
        <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider mb-1">
          {jogo.liga}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-zinc-100">{jogo.time_casa}</div>
          <div className="text-zinc-500 text-sm px-4">vs</div>
          <div className="text-lg font-bold text-zinc-100">{jogo.time_fora}</div>
        </div>
        <div className="text-zinc-600 text-xs mt-2 text-center">
          {formatarDataCompleta(jogo.data)}
        </div>
      </div>

      {/* Grid de contexto (forma, H2H, árbitro) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Forma Casa */}
        <ContextBox title={jogo.time_casa} icon="🏠">
          <InfoRow label="Últimos 5" value={forma_casa?.ultimos_jogos || '-'} />
          <InfoRow label="PPG em casa" value={forma_casa?.ppg_casa ?? '-'} />
          <InfoRow label="GM casa" value={forma_casa?.gols_marcados_casa ?? '-'} />
          <InfoRow label="GS casa" value={forma_casa?.gols_sofridos_casa ?? '-'} />
          {desfalques_casa.length > 0 && (
            <InfoRow label="Desfalques" value={desfalques_casa.join(', ')} />
          )}
        </ContextBox>

        {/* H2H */}
        <ContextBox title="Confronto Direto" icon="⚔️">
          <InfoRow label="Total jogos" value={h2h?.total_jogos ?? '-'} />
          <InfoRow label="Vitórias casa" value={h2h?.vitorias_casa ?? '-'} />
          <InfoRow label="Empates" value={h2h?.empates ?? '-'} />
          <InfoRow label="Vitórias fora" value={h2h?.vitorias_fora ?? '-'} />
          <InfoRow label="Média gols" value={h2h?.media_gols ?? '-'} />
        </ContextBox>

        {/* Forma Fora */}
        <ContextBox title={jogo.time_fora} icon="✈️">
          <InfoRow label="Últimos 5" value={forma_fora?.ultimos_jogos || '-'} />
          <InfoRow label="PPG fora" value={forma_fora?.ppg_fora ?? '-'} />
          <InfoRow label="GM fora" value={forma_fora?.gols_marcados_fora ?? '-'} />
          <InfoRow label="GS fora" value={forma_fora?.gols_sofridos_fora ?? '-'} />
          {desfalques_fora.length > 0 && (
            <InfoRow label="Desfalques" value={desfalques_fora.join(', ')} />
          )}
        </ContextBox>
      </div>

      {/* Árbitro */}
      {arbitro?.nome && (
        <div className="mb-6 bg-[#111111] border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">🟨 Árbitro:</span>
            <span className="text-zinc-300">{arbitro.nome}</span>
            {arbitro.amarelos_jogo != null && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-500">Amarelos/jogo:</span>
                <span className="text-zinc-300 font-mono">{arbitro.amarelos_jogo}</span>
              </>
            )}
            {arbitro.vermelhos_jogo != null && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-500">Vermelhos/jogo:</span>
                <span className="text-zinc-300 font-mono">{arbitro.vermelhos_jogo}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cards de Mercado */}
      <div>
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
          📊 Odds Justas por Mercado
        </h3>
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
              oddMercado={card.odd_mercado}
              nomeMercado={card.nome_mercado}
            />
          ))}
        </div>
        {cards_mercado.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-sm">
            Dados estatísticos insuficientes para calcular odds justas deste jogo.
          </div>
        )}
      </div>
    </div>
  );
}

function ContextBox({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-3">
      <div className="text-zinc-300 text-xs font-semibold mb-2">
        {icon} {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-zinc-600">{label}</span>
      <span className="text-zinc-300 font-mono truncate ml-2 max-w-[180px]">{String(value)}</span>
    </div>
  );
}

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
