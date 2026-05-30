'use client';

import { useState } from 'react';
import StatsAvancadas from './StatsAvancadas';
import ShotmapDisplay from './ShotmapDisplay';

interface XgBucket {
  m: number;
  xg_home: number;
  xg_away: number;
  cum_home: number;
  cum_away: number;
}

interface MomentumPoint {
  m: number;
  v: number; // -100 (total visitante) a +100 (total casa)
}

interface MatchAnalyticsProps {
  statsAvancadas: { home: any; away: any } | null | undefined;
  shotmap: any[] | null | undefined;
  xgPorMinuto: XgBucket[] | null | undefined;
  momentum: MomentumPoint[] | null | undefined;
  averagePositions: any;
  timeCasa: string;
  timeFora: string;
}

export default function MatchAnalytics({
  statsAvancadas,
  shotmap,
  xgPorMinuto,
  momentum,
  averagePositions,
  timeCasa,
  timeFora,
}: MatchAnalyticsProps) {
  const [tab, setTab] = useState<'stats' | 'shotmap' | 'xg' | 'momentum'>('stats');

  const hasStats = !!statsAvancadas;
  const hasShotmap = !!shotmap && shotmap.length > 0;
  const hasXg = !!xgPorMinuto && xgPorMinuto.length > 0;
  const hasMomentum = !!momentum && momentum.length > 0;

  if (!hasStats && !hasShotmap && !hasXg && !hasMomentum) return null;

  const tabs: Array<{ key: string; label: string; count?: number; condition: boolean }> = [
    { key: 'stats', label: '📊 Estatísticas', condition: hasStats },
    { key: 'shotmap', label: `🎯 Chutes${hasShotmap ? ` (${shotmap!.length})` : ''}`, condition: hasShotmap },
    { key: 'xg', label: '📈 Gols Esperados', condition: hasXg },
    { key: 'momentum', label: '⚡ Pressão', condition: hasMomentum },
  ].filter((t) => t.condition);

  if (tabs.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5'
                : 'text-zinc-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === 'stats' && hasStats && (
          <StatsAvancadas
            home={statsAvancadas!.home}
            away={statsAvancadas!.away}
            timeCasa={timeCasa}
            timeFora={timeFora}
          />
        )}

        {tab === 'shotmap' && hasShotmap && (
          <ShotmapDisplay
            shotmap={shotmap!}
            timeCasa={timeCasa}
            timeFora={timeFora}
          />
        )}

        {tab === 'xg' && hasXg && (
          <XgTimelineChart data={xgPorMinuto!} timeCasa={timeCasa} timeFora={timeFora} />
        )}

        {tab === 'momentum' && hasMomentum && (
          <MomentumChart data={momentum!} timeCasa={timeCasa} timeFora={timeFora} />
        )}
      </div>
    </div>
  );
}

// ── xG Timeline Chart ──

function XgTimelineChart({
  data,
  timeCasa,
  timeFora,
}: {
  data: XgBucket[];
  timeCasa: string;
  timeFora: string;
}) {
  if (!data || data.length === 0) return null;

  const maxCum = Math.max(
    ...data.map((d) => Math.max(d.cum_home, d.cum_away)),
    0.1
  );

  return (
    <div>
      <h4 className="text-zinc-400 text-xs font-semibold mb-3">xG por Minuto (acumulado)</h4>

      {/* Total xG */}
      <div className="flex justify-center gap-6 text-xs mb-4">
        <div className="text-center">
          <div className="text-green-500 font-bold text-lg">
            {data[data.length - 1]?.cum_home.toFixed(2)}
          </div>
          <div className="text-zinc-600">{timeCasa}</div>
        </div>
        <div className="flex items-center text-zinc-600">x</div>
        <div className="text-center">
          <div className="text-blue-500 font-bold text-lg">
            {data[data.length - 1]?.cum_away.toFixed(2)}
          </div>
          <div className="text-zinc-600">{timeFora}</div>
        </div>
      </div>

      {/* Gráfico de linha SVG (acumulado) */}
      <div className="w-full max-w-[600px] mx-auto">
        <svg viewBox="0 0 100 40" className="w-full">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1="0"
              y1={40 - pct * 40}
              x2="100"
              y2={40 - pct * 40}
              stroke="#27272a"
              strokeWidth="0.3"
            />
          ))}

          {/* xG casa */}
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="0.8"
            points={data
              .filter((d) => d.m % 5 === 0 || d.m === 90)
              .map((d) => `${(d.m / 100) * 100},${40 - (d.cum_home / maxCum) * 35}`)
              .join(' ')}
          />

          {/* xG fora */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.8"
            points={data
              .filter((d) => d.m % 5 === 0 || d.m === 90)
              .map((d) => `${(d.m / 100) * 100},${40 - (d.cum_away / maxCum) * 35}`)
              .join(' ')}
          />

          {/* Labels minuto */}
          {[0, 15, 30, 45, 60, 75, 90].map((m) => (
            <text
              key={m}
              x={(m / 100) * 100}
              y="39"
              textAnchor="middle"
              fontSize="2"
              fill="#52525e"
            >
              {m}
            </text>
          ))}
        </svg>
      </div>

      {/* Barras por minuto (últimos 10 min ou mais relevantes) */}
      <div className="mt-4">
        <h5 className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2">Detalhamento por minuto</h5>
        <div className="flex gap-0.5 items-end h-16 overflow-x-auto pb-1">
          {data.map((d, i) => {
            const h = Math.max(2, (d.xg_home / maxCum) * 50);
            const a = Math.max(2, (d.xg_away / maxCum) * 50);
            return (
              <div key={i} className="flex flex-col items-center justify-end min-w-[6px]">
                <div
                  className="w-[4px] bg-blue-500 rounded-t"
                  style={{ height: `${a}px` }}
                  title={`${d.m}&apos; ${timeFora}: ${d.xg_away.toFixed(2)}`}
                />
                <div
                  className="w-[4px] bg-green-500 rounded-t mt-0.5"
                  style={{ height: `${h}px` }}
                  title={`${d.m}&apos; ${timeCasa}: ${d.xg_home.toFixed(2)}`}
                />
                {i % 10 === 0 && (
                  <span className="text-[5px] text-zinc-600 mt-0.5">{d.m}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-500 inline-block" /> {timeCasa}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 inline-block" /> {timeFora}
        </span>
      </div>
    </div>
  );
}

// ── Momentum Chart ──

function MomentumChart({
  data,
  timeCasa,
  timeFora,
}: {
  data: MomentumPoint[];
  timeCasa: string;
  timeFora: string;
}) {
  if (!data || data.length === 0) return null;

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.v)), 1);
  const avgMomentum = data.reduce((s, d) => s + d.v, 0) / data.length;

  function interpretarMomentum(avg: number): string {
    if (avg > 30) return `${timeCasa} dominou a partida`;
    if (avg > 10) return `${timeCasa} teve mais pressão`;
    if (avg > -10) return 'Partida equilibrada';
    if (avg > -30) return `${timeFora} teve mais pressão`;
    return `${timeFora} dominou a partida`;
  }

  return (
    <div>
      <h4 className="text-zinc-400 text-xs font-semibold mb-2">Índice de Pressão</h4>
      <p className="text-zinc-500 text-[10px] mb-3 italic">
        {interpretarMomentum(avgMomentum)} (média: {avgMomentum > 0 ? '+' : ''}{avgMomentum.toFixed(0)})
      </p>

      <div className="w-full max-w-[600px] mx-auto">
        <svg viewBox="0 0 100 40" className="w-full">
          {/* Linha central */}
          <line x1="0" y1="20" x2="100" y2="20" stroke="#27272a" strokeWidth="0.5" />

          {/* Área casa (positivo) */}
          <rect x="0" y="0" width="100" height="20" fill="#22c55e05" />

          {/* Área visitante (negativo) */}
          <rect x="0" y="20" width="100" height="20" fill="#3b82f605" />

          {/* Linha de momentum */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="0.8"
            points={data
              .filter((d) => d.m % 2 === 0 || d.m === 90)
              .map((d) => `${(d.m / 100) * 100},${20 - (d.v / maxAbs) * 18}`)
              .join(' ')}
          />
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="0.3"
            strokeOpacity={0.3}
            points={data
              .filter((d) => d.m % 2 === 0 || d.m === 90)
              .map((d) => `${(d.m / 100) * 100},${20 - (d.v / maxAbs) * 18} ${(d.m / 100) * 100},20`)
              .join(' ')}
          />

          {/* Labels minuto */}
          {[0, 15, 30, 45, 60, 75, 90].map((m) => (
            <text
              key={m}
              x={(m / 100) * 100}
              y="38"
              textAnchor="middle"
              fontSize="2"
              fill="#52525e"
            >
              {m}
            </text>
          ))}

          {/* Labels times */}
          <text x="2" y="3" fontSize="2.5" fill="#22c55e" opacity={0.6}>{timeCasa}</text>
          <text x="2" y="37" fontSize="2.5" fill="#3b82f6" opacity={0.6}>{timeFora}</text>
        </svg>
      </div>

      {/* Destaques de momentum */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-green-900/10 rounded p-2 text-center">
          <div className="text-green-500 font-mono font-bold">
            +{Math.round(Math.max(...data.map((d) => d.v)))}
          </div>
          <div className="text-zinc-600 text-[10px]">Pico {timeCasa}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="text-zinc-400 font-mono font-bold">
            {Math.round(avgMomentum)}
          </div>
          <div className="text-zinc-600 text-[10px]">Média</div>
        </div>
        <div className="bg-blue-900/10 rounded p-2 text-center">
          <div className="text-blue-500 font-mono font-bold">
            {Math.round(Math.abs(Math.min(...data.map((d) => d.v))))}
          </div>
          <div className="text-zinc-600 text-[10px]">Pico {timeFora}</div>
        </div>
      </div>
    </div>
  );
}
