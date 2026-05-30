'use client';

interface Shot {
  player?: string;
  player_id?: number;
  minute: number;
  x: number;       // 0-1 normalized (0 = left touchline, 1 = right)
  y: number;       // 0-1 normalized (0 = top/baseline, 1 = bottom/baseline)
  xg: number;
  body_part?: string;
  situation?: string;
  is_goal: boolean;
  is_home: boolean;
  is_on_target: boolean;
}

interface ShotmapDisplayProps {
  shotmap: Shot[];
  timeCasa: string;
  timeFora: string;
}

export default function ShotmapDisplay({ shotmap, timeCasa, timeFora }: ShotmapDisplayProps) {
  if (!shotmap || shotmap.length === 0) return null;

  const homeShots = shotmap.filter((s) => s.is_home);
  const awayShots = shotmap.filter((s) => !s.is_home);

  const homeGoals = homeShots.filter((s) => s.is_goal).length;
  const awayGoals = awayShots.filter((s) => s.is_goal).length;
  const maxXg = Math.max(...shotmap.map((s) => s.xg), 0.1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">
        🎯 Mapa de Chutes
      </h3>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">{timeCasa}</span>
            <span className="text-green-500 font-bold">{homeGoals} gol{homeGoals !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-zinc-500 mt-1">{homeShots.length} chutes ({homeShots.filter((s) => s.is_on_target).length} no gol)</div>
          <div className="flex gap-1 mt-1">
            {homeShots.map((s, i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full ${s.is_goal ? 'bg-green-500' : s.is_on_target ? 'bg-orange-500' : 'bg-zinc-700'}`}
                title={`${s.player || ''} ${s.minute}&apos; xG=${s.xg.toFixed(2)}`}
              />
            ))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">{timeFora}</span>
            <span className="text-blue-500 font-bold">{awayGoals} gol{awayGoals !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-zinc-500 mt-1">{awayShots.length} chutes ({awayShots.filter((s) => s.is_on_target).length} no gol)</div>
          <div className="flex gap-1 mt-1">
            {awayShots.map((s, i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full ${s.is_goal ? 'bg-blue-500' : s.is_on_target ? 'bg-purple-500' : 'bg-zinc-700'}`}
                title={`${s.player || ''} ${s.minute}&apos; xG=${s.xg.toFixed(2)}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Campo de futebol SVG */}
      <div className="w-full max-w-[500px] mx-auto">
        <svg viewBox="0 0 100 150" className="w-full bg-green-900/40 rounded-lg" style={{ aspectRatio: '2/3' }}>
          {/* Campo */}
          <rect x="0" y="0" width="100" height="150" fill="none" stroke="#22c55e20" strokeWidth="0.5" />

          {/* Linhas do campo */}
          <line x1="0" y1="75" x2="100" y2="75" stroke="#22c55e30" strokeWidth="0.3" strokeDasharray="2,2" />
          <circle cx="50" cy="75" r="8" fill="none" stroke="#22c55e30" strokeWidth="0.3" />

          {/* Grande área (atacando para cima = time da casa) */}
          <rect x="20" y="0" width="60" height="15" fill="none" stroke="#22c55e30" strokeWidth="0.3" />
          <rect x="32" y="0" width="36" height="5" fill="none" stroke="#22c55e30" strokeWidth="0.3" />
          <circle cx="50" cy="3" r="0.8" fill="#22c55e30" />

          {/* Grande área (atacando para baixo = time visitante) */}
          <rect x="20" y="135" width="60" height="15" fill="none" stroke="#22c55e30" strokeWidth="0.3" />
          <rect x="32" y="145" width="36" height="5" fill="none" stroke="#22c55e30" strokeWidth="0.3" />
          <circle cx="50" cy="147" r="0.8" fill="#22c55e30" />

          {/* Bandeirinhas */}
          <circle cx="0" cy="0" r="0.5" fill="#22c55e30" />
          <circle cx="100" cy="0" r="0.5" fill="#22c55e30" />
          <circle cx="0" cy="150" r="0.5" fill="#22c55e30" />
          <circle cx="100" cy="150" r="0.5" fill="#22c55e30" />

          {/* Shotmap — time da casa ataca para cima */}
          {homeShots.map((shot, i) => {
            const r = Math.max(1.5, (shot.xg / maxXg) * 4);
            return (
              <g key={`h-${i}`}>
                <circle
                  cx={shot.x * 100}
                  cy={150 - shot.y * 150} // invertido: time da casa ataca de baixo p/ cima
                  r={r}
                  fill={shot.is_goal ? '#22c55e' : shot.is_on_target ? '#f97316' : '#18181b'}
                  fillOpacity={shot.is_goal ? 0.9 : 0.6}
                  stroke={shot.is_goal ? '#22c55e' : '#52525e'}
                  strokeWidth={0.3}
                />
                <text
                  x={shot.x * 100}
                  y={150 - shot.y * 150 + 0.4}
                  textAnchor="middle"
                  fontSize="1.5"
                  fill="white"
                  fontWeight="bold"
                  opacity={0.7}
                >
                  {shot.minute}
                </text>
              </g>
            );
          })}

          {/* Shotmap — time visitante ataca para baixo */}
          {awayShots.map((shot, i) => {
            const r = Math.max(1.5, (shot.xg / maxXg) * 4);
            return (
              <g key={`a-${i}`}>
                <circle
                  cx={shot.x * 100}
                  cy={shot.y * 150} // normal: time visitante ataca de cima p/ baixo
                  r={r}
                  fill={shot.is_goal ? '#3b82f6' : shot.is_on_target ? '#a855f7' : '#18181b'}
                  fillOpacity={shot.is_goal ? 0.9 : 0.6}
                  stroke={shot.is_goal ? '#3b82f6' : '#52525e'}
                  strokeWidth={0.3}
                />
                <text
                  x={shot.x * 100}
                  y={shot.y * 150 + 0.4}
                  textAnchor="middle"
                  fontSize="1.5"
                  fill="white"
                  fontWeight="bold"
                  opacity={0.7}
                >
                  {shot.minute}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Gol
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> No gol
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" /> Fora
        </span>
        <span className="text-zinc-700 ml-2">Tamanho = xG</span>
      </div>
    </div>
  );
}
