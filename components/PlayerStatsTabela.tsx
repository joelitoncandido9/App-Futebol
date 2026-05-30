'use client';

interface PlayerStat {
  jogador_id?: number;
  time_id?: number;
  minutos?: number;
  rating?: number;
  gols?: number;
  assistencias?: number;
  xg?: number;
  xa?: number;
  chutes_total?: number;
  chutes_no_gol?: number;
  passes_total?: number;
  passes_certos?: number;
  passes_chave?: number;
  desarmes?: number;
  interceptacoes?: number;
  cartao_amarelo?: number;
  cartao_vermelho?: number;
  defesas?: number | null;
  // Support for raw API format too
  nome?: string;
  posicao?: string;
  minutes_played?: number;
}

interface PlayerStatsTabelaProps {
  players: PlayerStat[];
  timeCasa: string;
  timeFora: string;
  teamIdCasa?: number;
  teamIdFora?: number;
}

export default function PlayerStatsTabela({
  players,
  timeCasa,
  timeFora,
  teamIdCasa,
  teamIdFora,
}: PlayerStatsTabelaProps) {
  if (!players || players.length === 0) return null;

  // Separa por time
  const casaPlayers = players.filter(
    (p) => p.time_id === teamIdCasa || (!teamIdCasa && !teamIdFora && players.indexOf(p) < players.length / 2)
  );
  const foraPlayers = players.filter(
    (p) => p.time_id === teamIdFora || (!teamIdCasa && !teamIdFora && players.indexOf(p) >= players.length / 2)
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          🌟 Rating dos Jogadores
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 p-4">
        <div>
          <h4 className="text-foreground/80 text-xs font-semibold mb-2 px-1">{timeCasa}</h4>
          {renderTabela(casaPlayers)}
        </div>
        <div>
          <h4 className="text-foreground/80 text-xs font-semibold mb-2 px-1 mt-4 md:mt-0">{timeFora}</h4>
          {renderTabela(foraPlayers)}
        </div>
      </div>
    </div>
  );
}

function renderTabela(players: PlayerStat[]) {
  if (players.length === 0) {
    return <p className="text-muted-foreground text-xs py-4 text-center">Sem dados disponíveis</p>;
  }

  const maxRating = Math.max(...players.map((p) => p.rating || 0));
  const minRating = Math.min(...players.map((p) => p.rating || 999));

  // Ordena por minutos (mais minutos primeiro) e depois por rating
  const sorted = [...players].sort((a, b) => {
    const minA = a.minutos || a.minutes_played || 0;
    const minB = b.minutos || b.minutes_played || 0;
    if (minB !== minA) return minB - minA;
    return (b.rating || 0) - (a.rating || 0);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-muted-foreground font-medium px-2 py-1.5">Jogador</th>
            <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-8">Min</th>
            <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-8">⭐</th>
            <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-8">G</th>
            <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-8">A</th>
            <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-10">xG</th>
            <th className="text-center text-muted-foreground font-medium px-1.5 py-1.5 w-8">🟨</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, idx) => {
            const rating = p.rating;
            const isTop = rating === maxRating && rating > 0;
            const isBottom = rating === minRating && rating < maxRating && rating > 0;

            return (
              <tr
                key={p.jogador_id || idx}
                className={`border-b border-border/20 hover:bg-muted/80 ${
                  isTop ? 'bg-green-900/10' : ''
                } ${isBottom ? 'bg-red-900/10' : ''}`}
              >
                <td className="px-2 py-1.5">
                  <span className={`text-foreground/80 ${isTop ? 'text-green-400 font-medium' : ''} ${isBottom ? 'text-red-400' : ''}`}>
                    {p.nome || `#${p.jogador_id || idx + 1}`}
                  </span>
                </td>
                <td className="text-center px-1.5 py-1.5 font-mono text-muted-foreground">
                  {p.minutos || p.minutes_played || '-'}
                </td>
                <td className="text-center px-1.5 py-1.5 font-mono">
                  {rating != null ? (
                    <span className={`${rating >= 8 ? 'text-green-400 font-bold' : rating >= 6.5 ? 'text-foreground/80' : 'text-red-400'}`}>
                      {rating.toFixed(1)}
                    </span>
                  ) : '-'}
                </td>
                <td className="text-center px-1.5 py-1.5 font-mono text-green-500">
                  {p.gols || '-'}
                </td>
                <td className="text-center px-1.5 py-1.5 font-mono text-blue-400">
                  {p.assistencias || '-'}
                </td>
                <td className="text-center px-1.5 py-1.5 font-mono text-muted-foreground">
                  {p.xg != null ? p.xg.toFixed(2) : '-'}
                </td>
                <td className="text-center px-1.5 py-1.5">
                  {p.cartao_amarelo ? '🟨' : p.cartao_vermelho ? '🟥' : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
