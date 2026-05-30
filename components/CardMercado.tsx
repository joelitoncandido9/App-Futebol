'use client';

interface LinhaOverUnder {
  linha: number;
  prob_over: number;
  odd_over: number;
  prob_under: number;
  odd_under: number;
}

interface OddsContagem {
  lambda: number;
  linhas: LinhaOverUnder[];
}

interface Odds1X2 {
  casa_prob: number;
  casa_odd: number;
  empate_prob: number;
  empate_odd: number;
  fora_prob: number;
  fora_odd: number;
}

interface OddsBTTS {
  prob_sim: number;
  odd_sim: number;
  prob_nao: number;
  odd_nao: number;
}

interface CardMercadoProps {
  titulo: string;
  tipo: 'contagem_dupla' | '1x2' | 'btts';
  timeCasa: string;
  timeFora: string;
  oddsCasa?: OddsContagem;
  oddsFora?: OddsContagem;
  oddsCombinado?: OddsContagem;
  amostraCasa: number;
  amostraFora: number;
  odds1x2?: Odds1X2;
  oddsBtts?: OddsBTTS;
  oddMercado?: number;
}

export default function CardMercado(props: CardMercadoProps) {
  const { titulo, tipo, timeCasa, timeFora } = props;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden glow-accent">
      {/* Gradient accent */}
      <div className="h-0.5 bg-gradient-to-r from-orange-500/80 via-orange-400/40 to-transparent" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-orange-400 text-[11px] font-bold uppercase tracking-[0.08em]">{titulo}</span>
          {props.oddMercado && (
            <span className="text-zinc-600 text-[10px]">
              Mercado: <span className="text-orange-300 font-mono font-bold">{Number(props.oddMercado).toFixed(2)}</span>
            </span>
          )}
        </div>

        {tipo === 'contagem_dupla' && (
          <TabelaContagemDupla
            timeCasa={timeCasa}
            timeFora={timeFora}
            oddsCasa={props.oddsCasa as OddsContagem}
            oddsFora={props.oddsFora as OddsContagem}
            oddsCombinado={props.oddsCombinado as OddsContagem}
            amostraCasa={props.amostraCasa}
            amostraFora={props.amostraFora}
          />
        )}

        {tipo === '1x2' && (
          <Tabela1X2
            odds={props.odds1x2 as Odds1X2}
            timeCasa={timeCasa}
            timeFora={timeFora}
            amostraCasa={props.amostraCasa}
            amostraFora={props.amostraFora}
          />
        )}

        {tipo === 'btts' && (
          <TabelaBTTS
            odds={props.oddsBtts as OddsBTTS}
            timeCasa={timeCasa}
            timeFora={timeFora}
            amostraCasa={props.amostraCasa}
            amostraFora={props.amostraFora}
          />
        )}
      </div>
    </div>
  );
}

// ── CONTAGEM DUPLA (casa + fora lado a lado) ──

function TabelaContagemDupla({
  timeCasa, timeFora,
  oddsCasa, oddsFora, oddsCombinado,
  amostraCasa, amostraFora,
}: {
  timeCasa: string; timeFora: string;
  oddsCasa: OddsContagem; oddsFora: OddsContagem; oddsCombinado?: OddsContagem;
  amostraCasa: number; amostraFora: number;
}) {
  return (
    <div>
      {/* Header: Médias por time + combinado */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
        <div className="text-center flex-1">
          <div className="text-gray-400 text-[9px] uppercase tracking-wide">{timeCasa}</div>
          <div className="text-orange-500 font-mono text-sm font-black">{oddsCasa?.lambda ?? '-'}</div>
          <div className="text-gray-400 text-[9px]">{amostraCasa}j</div>
        </div>
        <div className="text-center flex-1">
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-400/10 rounded-lg px-3 py-1">
            <div className="text-orange-600 text-[9px] font-bold uppercase tracking-wider">⚡ Total Partida</div>
            <div className="text-orange-600 font-mono text-lg font-black">{(oddsCasa?.lambda ?? 0) + (oddsFora?.lambda ?? 0)}</div>
            <div className="text-orange-400 text-[8px]">MÉDIA /j</div>
          </div>
        </div>
        <div className="text-center flex-1">
          <div className="text-gray-400 text-[9px] uppercase tracking-wide">{timeFora}</div>
          <div className="text-orange-500 font-mono text-sm font-black">{oddsFora?.lambda ?? '-'}</div>
          <div className="text-gray-400 text-[9px]">{amostraFora}j</div>
        </div>
      </div>

      {/* Tabela compacta: Linha | Prob | OJ | Casa | Fora */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-gray-400 text-[9px] uppercase tracking-wider border-b border-gray-100">
              <th className="text-left py-1.5 pr-2 w-14">Linha</th>
              <th className="text-right py-1.5 px-2">Prob</th>
              <th className="text-right py-1.5 px-2 w-14">OJ</th>
              <th className="text-right py-1.5 px-2 w-12">{timeCasa.substring(0, 4)}</th>
              <th className="text-right py-1.5 pl-2 w-12">{timeFora.substring(0, 4)}</th>
            </tr>
          </thead>
          <tbody>
            {oddsCasa?.linhas.map((lc, i) => {
              const lf = oddsFora?.linhas[i];
              const lx = oddsCombinado?.linhas[i];
              return (
                <tr key={lc.linha} className="border-b border-gray-50 hover:bg-orange-50/30">
                  {/* Over */}
                  <td className="py-1.5 pr-2">
                    <span className="text-green-600 font-semibold">O{lc.linha}</span>
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-gray-800 font-mono font-bold">{lx?.prob_over ?? '-'}%</span>
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-orange-600 font-mono font-bold">{lx?.odd_over ?? '-'}</span>
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-gray-600 font-mono">{lc.prob_over}%</span>
                  </td>
                  <td className="py-1.5 pl-2 text-right">
                    <span className="text-gray-600 font-mono">{lf?.prob_over ?? '-'}%</span>
                  </td>
                </tr>
              );
            })}
            {/* Under rows */}
            {oddsCasa?.linhas.map((lc, i) => {
              const lf = oddsFora?.linhas[i];
              const lx = oddsCombinado?.linhas[i];
              if (!lx) return null;
              return (
                <tr key={`u-${lc.linha}`} className="border-b border-gray-50 hover:bg-red-50/20">
                  <td className="py-1.5 pr-2">
                    <span className="text-red-600 font-semibold">U{lc.linha}</span>
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-gray-800 font-mono font-bold">{lx.prob_under}%</span>
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-orange-600 font-mono font-bold">{lx.odd_under}</span>
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span className="text-gray-600 font-mono">{lc.prob_under}%</span>
                  </td>
                  <td className="py-1.5 pl-2 text-right">
                    <span className="text-gray-600 font-mono">{lf?.prob_under ?? '-'}%</span>
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

// ── 1X2 ──

function Tabela1X2({
  odds,
  timeCasa,
  timeFora,
}: {
  odds: Odds1X2;
  timeCasa: string;
  timeFora: string;
  amostraCasa: number;
  amostraFora: number;
}) {
  if (!odds) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-green-900/10 border border-green-500/10 rounded-lg p-3 text-center">
        <div className="text-green-500 text-[10px] font-semibold uppercase tracking-wider mb-1">{timeCasa}</div>
        <div className="text-green-400 font-mono text-lg font-black">{odds.casa_prob}%</div>
        <div className="text-green-400/80 font-mono text-xs font-bold">OJ: {odds.casa_odd}</div>
      </div>
      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 text-center">
        <div className="text-yellow-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Empate</div>
        <div className="text-yellow-400 font-mono text-lg font-black">{odds.empate_prob}%</div>
        <div className="text-yellow-400/80 font-mono text-xs font-bold">OJ: {odds.empate_odd}</div>
      </div>
      <div className="bg-blue-900/10 border border-blue-500/10 rounded-lg p-3 text-center">
        <div className="text-blue-500 text-[10px] font-semibold uppercase tracking-wider mb-1">{timeFora}</div>
        <div className="text-blue-400 font-mono text-lg font-black">{odds.fora_prob}%</div>
        <div className="text-blue-400/80 font-mono text-xs font-bold">OJ: {odds.fora_odd}</div>
      </div>
    </div>
  );
}

// ── BTTS ──

function TabelaBTTS({
  odds,
}: {
  odds: OddsBTTS;
  timeCasa: string;
  timeFora: string;
  amostraCasa: number;
  amostraFora: number;
}) {
  if (!odds) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-green-900/10 border border-green-500/10 rounded-lg p-3 text-center">
        <div className="text-green-500 text-[10px] font-semibold uppercase mb-1">Sim</div>
        <div className="text-green-400 font-mono text-lg font-black">{odds.prob_sim}%</div>
        <div className="text-green-400/80 font-mono text-xs font-bold">OJ: {odds.odd_sim}</div>
      </div>
      <div className="bg-red-900/10 border border-red-500/10 rounded-lg p-3 text-center">
        <div className="text-red-500 text-[10px] font-semibold uppercase mb-1">Não</div>
        <div className="text-red-400 font-mono text-lg font-black">{odds.prob_nao}%</div>
        <div className="text-red-400/80 font-mono text-xs font-bold">OJ: {odds.odd_nao}</div>
      </div>
    </div>
  );
}
