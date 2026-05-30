'use client';

interface TeamStats {
  total_shots?: number;
  shots_on_target?: number;
  ball_possession?: number;
  crosses?: { value: number; total: number; pct: number };
  dribbles?: { value: number; total: number; pct: number };
  long_balls?: { value: number; total: number; pct: number };
  aerial_duels?: { value: number; total: number; pct: number };
  ground_duels?: { value: number; total: number; pct: number };
  final_third_phase?: { value: number; total: number; pct: number };
  attack?: number;
  ball_safe?: number;
  dangerous_attack?: number;
  pass_accuracy_pct?: number;
  total_passes?: number;
  accurate_passes?: number;
  corners?: number;
  offsides?: number;
  fouls?: number;
  yellow_cards?: number;
  red_cards?: number;
}

interface StatsAvancadasProps {
  home: TeamStats;
  away: TeamStats;
  timeCasa: string;
  timeFora: string;
}

export default function StatsAvancadas({ home, away, timeCasa, timeFora }: StatsAvancadasProps) {
  if (!home || !away) return null;

  const stats: Array<{
    label: string;
    casa: number | string | null | undefined;
    fora: number | string | null | undefined;
    format?: 'float' | 'pct' | 'ratio';
    invert?: boolean; // true = menor é melhor (ex: faltas)
  }> = [
    { label: 'Posse de bola', casa: home.ball_possession, fora: away.ball_possession, format: 'pct' },
    { label: 'Precisão de passes', casa: home.pass_accuracy_pct, fora: away.pass_accuracy_pct, format: 'pct' },
    { label: 'Passes certos', casa: home.accurate_passes, fora: away.accurate_passes },
    { label: 'Total de passes', casa: home.total_passes, fora: away.total_passes },
    { label: 'Chutes', casa: home.total_shots, fora: away.total_shots },
    { label: 'Chutes no gol', casa: home.shots_on_target, fora: away.shots_on_target },
    { label: 'Ataques', casa: home.attack, fora: away.attack },
    { label: 'Ataques perigosos', casa: home.dangerous_attack, fora: away.dangerous_attack },
    { label: 'Bola segura', casa: home.ball_safe, fora: away.ball_safe },
    { label: 'Escanteios', casa: home.corners, fora: away.corners },
    { label: 'Impedimentos', casa: home.offsides, fora: away.offsides },
    { label: 'Faltas', casa: home.fouls, fora: away.fouls, invert: true },
    { label: 'Cartões amarelos', casa: home.yellow_cards, fora: away.yellow_cards },
    { label: 'Cartões vermelhos', casa: home.red_cards, fora: away.red_cards },
  ];

  const ratioStats: Array<{
    label: string;
    homeData: { value: number; total: number; pct: number } | undefined;
    awayData: { value: number; total: number; pct: number } | undefined;
  }> = [
    { label: 'Cruzamentos', homeData: home.crosses, awayData: away.crosses },
    { label: 'Dribles', homeData: home.dribbles, awayData: away.dribbles },
    { label: 'Lançamentos longos', homeData: home.long_balls, awayData: away.long_balls },
    { label: 'Duelos aéreos', homeData: home.aerial_duels, awayData: away.aerial_duels },
    { label: 'Duelos no chão', homeData: home.ground_duels, awayData: away.ground_duels },
    { label: 'Último terço', homeData: home.final_third_phase, awayData: away.final_third_phase },
  ];

  const hasSimpleStats = stats.some((s) => s.casa != null || s.fora != null);
  const hasRatioStats = ratioStats.some((r) => r.homeData || r.awayData);

  if (!hasSimpleStats && !hasRatioStats) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          📊 Estatísticas Avançadas da Partida
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200/50">
              <th className="text-left text-zinc-600 font-medium px-4 py-2 w-[120px]">{timeCasa}</th>
              <th className="text-center text-zinc-600 font-medium px-3 py-2">Métrica</th>
              <th className="text-right text-zinc-600 font-medium px-4 py-2 w-[120px]">{timeFora}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              if (s.casa == null && s.fora == null) return null;
              return (
                <tr key={s.label} className="border-b border-gray-200/30 hover:bg-gray-100">
                  <td className={`px-4 py-2.5 font-mono ${getColor(s.casa, s.fora, 'left', s.invert)}`}>
                    {formatStat(s.casa, s.format)}
                  </td>
                  <td className="px-3 py-2.5 text-center text-zinc-500">{s.label}</td>
                  <td className={`px-4 py-2.5 text-right font-mono ${getColor(s.fora, s.casa, 'right', s.invert)}`}>
                    {formatStat(s.fora, s.format)}
                  </td>
                </tr>
              );
            })}
            {/* Ratio stats */}
            {ratioStats.map((r) => {
              if (!r.homeData && !r.awayData) return null;
              const h = r.homeData;
              const a = r.awayData;
              return (
                <tr key={r.label} className="border-b border-gray-200/30 hover:bg-gray-100">
                  <td className="px-4 py-2.5">
                    <div className="text-gray-700 font-mono text-xs">
                      {h ? `${h.value}/${h.total} (${h.pct}%)` : '-'}
                    </div>
                    {/* Barra de progresso */}
                    {h && h.total > 0 && (
                      <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
                        <div
                          className="bg-orange-500 h-1 rounded-full"
                          style={{ width: `${h.pct}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-zinc-500 text-xs">{r.label}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="text-gray-700 font-mono text-xs">
                      {a ? `${a.value}/${a.total} (${a.pct}%)` : '-'}
                    </div>
                    {a && a.total > 0 && (
                      <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
                        <div
                          className="bg-orange-500 h-1 rounded-full"
                          style={{ width: `${a.pct}%` }}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatStat(val: number | string | null | undefined, format?: 'float' | 'pct' | 'ratio'): string {
  if (val == null) return '-';
  if (typeof val === 'string') return val;
  if (format === 'pct') return `${val}%`;
  if (format === 'float') return val.toFixed(1);
  return val.toFixed(0);
}

function getColor(
  val: number | string | null | undefined,
  other: number | string | null | undefined,
  side: 'left' | 'right',
  invert?: boolean
): string {
  if (val == null || other == null) return 'text-zinc-400';
  const v = typeof val === 'number' ? val : parseFloat(String(val));
  const o = typeof other === 'number' ? other : parseFloat(String(other));
  if (isNaN(v) || isNaN(o)) return 'text-zinc-400';
  if (v === o) return 'text-gray-700';
  const better = invert ? v < o : v > o;
  if (better) return 'text-orange-400 font-bold';
  return 'text-zinc-400';
}
