'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';
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
  v: number;
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
  statsAvancadas, shotmap, xgPorMinuto, momentum,
  averagePositions, timeCasa, timeFora,
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
    <div>
      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`shrink-0 px-3 py-1.5 text-[10px] rounded-lg font-medium whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'glass text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-2">
        {tab === 'stats' && hasStats && (
          <StatsAvancadas
            home={statsAvancadas!.home}
            away={statsAvancadas!.away}
            timeCasa={timeCasa}
            timeFora={timeFora}
          />
        )}
        {tab === 'shotmap' && hasShotmap && (
          <ShotmapDisplay shotmap={shotmap!} timeCasa={timeCasa} timeFora={timeFora} />
        )}
        {tab === 'xg' && hasXg && <XgTimelineChart data={xgPorMinuto!} timeCasa={timeCasa} timeFora={timeFora} />}
        {tab === 'momentum' && hasMomentum && <MomentumChart data={momentum!} timeCasa={timeCasa} timeFora={timeFora} />}
      </div>
    </div>
  );
}

// ── xG Timeline Chart (Recharts) ──

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

  const last = data[data.length - 1];
  const maxCum = Math.max(last?.cum_home || 0.1, last?.cum_away || 0.1);
  const chartData = data.filter((d) => d.m % 2 === 0 || d.m === 90);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-sm">
        <div className="text-muted-foreground font-medium mb-1">{label}&apos;</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-foreground/80">{p.name}: <span className="font-mono font-bold">{Number(p.value).toFixed(2)}</span></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h4 className="text-muted-foreground text-xs font-semibold mb-3">Gols Esperados por Minuto</h4>
      <div className="flex justify-center gap-6 text-xs mb-4">
        <div className="text-center">
          <div className="text-green-500 font-bold text-lg">{last?.cum_home.toFixed(2)}</div>
          <div className="text-muted-foreground">{timeCasa}</div>
        </div>
        <div className="flex items-center text-muted-foreground">x</div>
        <div className="text-center">
          <div className="text-blue-500 font-bold text-lg">{last?.cum_away.toFixed(2)}</div>
          <div className="text-muted-foreground">{timeFora}</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} ticks={[0, 15, 30, 45, 60, 75, 90]} domain={[0, 90]} />
          <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} domain={[0, maxCum * 1.15]} tickFormatter={(v: number) => v.toFixed(1)} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="cum_home" name={timeCasa} stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
          <Line type="monotone" dataKey="cum_away" name={timeFora} stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4">
        <h5 className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2">Detalhamento por minuto</h5>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="m" hide />
            <Tooltip content={({ active, payload, label }: any) => {
              if (!active || !payload) return null;
              return (
                <div className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs shadow-sm">
                  <div className="text-muted-foreground font-medium mb-0.5">{label}&apos;</div>
                  {payload.map((p: any) => (
                    <div key={p.dataKey} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                      <span style={{ color: p.color }} className="font-mono">{Number(p.value).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              );
            }} />
            <Area type="monotone" dataKey="xg_home" name={timeCasa} stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} strokeWidth={1} />
            <Area type="monotone" dataKey="xg_away" name={timeFora} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Momentum Chart (Recharts) ──

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
  const chartData = data.filter((d) => d.m % 2 === 0 || d.m === 90);

  function interpretarMomentum(avg: number): string {
    if (avg > 30) return `${timeCasa} dominou a partida`;
    if (avg > 10) return `${timeCasa} teve mais pressão`;
    if (avg > -10) return 'Partida equilibrada';
    if (avg > -30) return `${timeFora} teve mais pressão`;
    return `${timeFora} dominou a partida`;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload[0]) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-sm">
        <div className="text-muted-foreground font-medium mb-1">{label}&apos;</div>
        <div className="text-orange-400 font-mono font-bold">{payload[0].value > 0 ? '+' : ''}{Number(payload[0].value).toFixed(0)}</div>
      </div>
    );
  };

  return (
    <div>
      <h4 className="text-muted-foreground text-xs font-semibold mb-2">Índice de Pressão</h4>
      <p className="text-muted-foreground text-[10px] mb-3 italic">
        {interpretarMomentum(avgMomentum)} (média: {avgMomentum > 0 ? '+' : ''}{avgMomentum.toFixed(0)})
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} ticks={[0, 15, 30, 45, 60, 75, 90]} domain={[0, 90]} />
          <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} domain={[-maxAbs * 1.2, maxAbs * 1.2]} tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}`} />
          <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="#f97316" strokeWidth={2} fill="url(#posGrad)" fillOpacity={0.8} dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-2 text-center">
          <div className="text-green-400 font-mono font-bold">+{Math.round(Math.max(...data.map((d) => d.v)))}</div>
          <div className="text-muted-foreground text-[10px]">Pico {timeCasa}</div>
        </div>
        <div className="bg-muted/50 border border-border/50 rounded-lg p-2 text-center">
          <div className="text-foreground/80 font-mono font-bold">{Math.round(avgMomentum)}</div>
          <div className="text-muted-foreground text-[10px]">Média</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-2 text-center">
          <div className="text-blue-400 font-mono font-bold">{Math.round(Math.abs(Math.min(...data.map((d) => d.v))))}</div>
          <div className="text-muted-foreground text-[10px]">Pico {timeFora}</div>
        </div>
      </div>
    </div>
  );
}
