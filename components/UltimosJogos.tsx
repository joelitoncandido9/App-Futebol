'use client';

interface Jogo {
  data: string;
  casa: string;
  fora: string;
  gols_casa: number | null;
  gols_fora: number | null;
  status?: string;
}

interface UltimosJogosProps {
  timeCasa: string;
  timeFora: string;
  jogosCasa: Jogo[];
  jogosFora: Jogo[];
}

export default function UltimosJogos({ timeCasa, timeFora, jogosCasa, jogosFora }: UltimosJogosProps) {
  if ((!jogosCasa || jogosCasa.length === 0) && (!jogosFora || jogosFora.length === 0)) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-orange-500/80 via-orange-400/40 to-transparent" />
      <div className="p-5">
        <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.08em] mb-4">
          📋 Últimos 10 Jogos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-foreground text-xs font-semibold mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {timeCasa}
            </h4>
            {renderTabela(jogosCasa, timeCasa)}
          </div>
          <div>
            <h4 className="text-foreground text-xs font-semibold mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {timeFora}
            </h4>
            {renderTabela(jogosFora, timeFora)}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderTabela(jogos: Jogo[], time: string) {
  if (!jogos || jogos.length === 0) {
    return <p className="text-muted-foreground text-xs">Sem dados disponíveis</p>;
  }

  return (
    <div className="space-y-1">
      {jogos.map((j, idx) => {
        const ehCasa = j.casa === time;
        const golsPro = ehCasa ? j.gols_casa : j.gols_fora;
        const golsContra = ehCasa ? j.gols_fora : j.gols_casa;
        const adv = ehCasa ? j.fora : j.casa;
        const vitoria = golsPro != null && golsContra != null && golsPro > golsContra;
        const derrota = golsPro != null && golsContra != null && golsPro < golsContra;

        return (
          <div
            key={idx}
            className={`flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg ${
              vitoria ? 'bg-green-500/10' : derrota ? 'bg-red-500/10' : 'bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`font-mono font-bold text-[10px] ${
                vitoria ? 'text-green-500' : derrota ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {vitoria ? 'W' : derrota ? 'L' : 'D'}
              </span>
              <span className={`text-[9px] font-bold ${
                ehCasa ? 'text-green-500/70' : 'text-blue-500/70'
              }`}>
                {ehCasa ? 'C' : 'F'}
              </span>
              <span className="text-muted-foreground text-[9px] font-mono shrink-0 w-14">
                {j.data?.slice(5) || ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center">
              <span className="text-foreground/80 truncate max-w-[80px]">{adv}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`font-mono font-bold ${
                vitoria ? 'text-green-500' : derrota ? 'text-red-500' : 'text-foreground'
              }`}>
                {golsPro ?? '?'}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className={`font-mono font-bold ${
                derrota ? 'text-red-500' : vitoria ? 'text-green-500' : 'text-foreground'
              }`}>
                {golsContra ?? '?'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
