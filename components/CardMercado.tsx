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
  time?: string;
  tipo: 'contagem' | 'contagem_dupla' | '1x2' | 'btts';
  // Single team
  oj1?: OddsContagem | Odds1X2 | OddsBTTS;
  oj2?: OddsContagem | Odds1X2 | OddsBTTS;
  amostraOJ1?: number;
  amostraOJ2?: number;
  // Dual team
  timeCasa?: string;
  timeFora?: string;
  oj1Casa?: OddsContagem;
  oj2Casa?: OddsContagem;
  oj1Fora?: OddsContagem;
  oj2Fora?: OddsContagem;
  amostraCasa?: number;
  amostraFora?: number;
  // Market comparison
  oddMercado?: number;
  nomeMercado?: string;
}

export default function CardMercado(props: CardMercadoProps) {
  const { titulo, time, tipo } = props;

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-orange-500 text-xs font-semibold uppercase tracking-wider">{titulo}</span>
          {time && <span className="text-zinc-300 text-sm ml-2">— {time}</span>}
        </div>
      </div>

      {tipo === 'contagem_dupla' && (
        <TabelaContagemDupla
          timeCasa={props.timeCasa || ''}
          timeFora={props.timeFora || ''}
          oj1Casa={props.oj1Casa as OddsContagem}
          oj2Casa={props.oj2Casa as OddsContagem}
          oj1Fora={props.oj1Fora as OddsContagem}
          oj2Fora={props.oj2Fora as OddsContagem}
          amostraCasa={props.amostraCasa || 0}
          amostraFora={props.amostraFora || 0}
        />
      )}

      {tipo === 'contagem' && props.oj1 && (
        <TabelaContagem
          oj1={props.oj1 as OddsContagem}
          oj2={props.oj2 as OddsContagem}
          amostraOJ1={props.amostraOJ1 || 0}
          amostraOJ2={props.amostraOJ2 || 0}
          oddMercado={props.oddMercado}
          nomeMercado={props.nomeMercado}
        />
      )}

      {tipo === '1x2' && (
        <Tabela1X2
          oj1={props.oj1 as Odds1X2}
          oj2={props.oj2 as Odds1X2}
          amostraOJ1={props.amostraOJ1 || 0}
          amostraOJ2={props.amostraOJ2 || 0}
          oddMercado={props.oddMercado}
        />
      )}

      {tipo === 'btts' && (
        <TabelaBTTS
          oj1={props.oj1 as OddsBTTS}
          oj2={props.oj2 as OddsBTTS}
          amostraOJ1={props.amostraOJ1 || 0}
          amostraOJ2={props.amostraOJ2 || 0}
          oddMercado={props.oddMercado}
        />
      )}
    </div>
  );
}

// ── TABELA CONTAGEM DUPLA (casa + fora lado a lado) ──

function TabelaContagemDupla({
  timeCasa, timeFora,
  oj1Casa, oj2Casa, oj1Fora, oj2Fora,
  amostraCasa, amostraFora,
}: {
  timeCasa: string; timeFora: string;
  oj1Casa: OddsContagem; oj2Casa: OddsContagem;
  oj1Fora: OddsContagem; oj2Fora: OddsContagem;
  amostraCasa: number; amostraFora: number;
}) {
  const maxLinhas = Math.min(oj1Casa?.linhas?.length || 0, oj1Fora?.linhas?.length || 0);

  return (
    <>
      {/* λ por time */}
      <div className="grid grid-cols-5 gap-1 text-xs text-zinc-500 mb-2 pb-2 border-b border-zinc-800">
        <div />
        <div className="text-center font-medium">{timeCasa}</div>
        <div className="text-center font-medium text-zinc-600">/</div>
        <div className="text-center font-medium">{timeFora}</div>
        <div />
      </div>
      <div className="grid grid-cols-5 gap-1 text-xs mb-3">
        <div className="text-zinc-400">λ (média)</div>
        <div className="text-center text-orange-400 font-mono font-bold">{oj1Casa?.lambda ?? '-'}/j</div>
        <div className="text-center text-zinc-600">vs</div>
        <div className="text-center text-orange-400 font-mono font-bold">{oj1Fora?.lambda ?? '-'}/j</div>
        <div />
      </div>

      {/* Linhas Over/Under para cada time */}
      {Array.from({ length: maxLinhas }).map((_, i) => {
        const lc = oj1Casa?.linhas[i];
        const lf = oj1Fora?.linhas[i];
        if (!lc || !lf) return null;
        return (
          <div key={lc.linha} className="grid grid-cols-5 gap-1 text-xs py-1.5 hover:bg-zinc-800/40 rounded px-1 -mx-1 items-center">
            <div className="text-zinc-500">Over {lc.linha}</div>
            <div className="text-center">
              <span className="text-zinc-300">{lc.prob_over}%</span>
              <span className="text-orange-400 font-mono ml-1">→ {lc.odd_over}</span>
            </div>
            <div className="text-center text-zinc-600 text-[10px]">vs</div>
            <div className="text-center">
              <span className="text-zinc-300">{lf.prob_over}%</span>
              <span className="text-orange-400 font-mono ml-1">→ {lf.odd_over}</span>
            </div>
            <div className="text-zinc-500 text-right">Under {lc.linha}</div>
          </div>
        );
      })}

      {/* Amostras */}
      <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between text-xs text-zinc-600">
        <span>{timeCasa}: {amostraCasa}j</span>
        <span>{timeFora}: {amostraFora}j</span>
      </div>
    </>
  );
}

// ── TABELA CONTAGEM (time único) ──

function TabelaContagem({
  oj1, oj2, amostraOJ1, amostraOJ2, oddMercado, nomeMercado,
}: {
  oj1: OddsContagem; oj2: OddsContagem;
  amostraOJ1: number; amostraOJ2: number;
  oddMercado?: number; nomeMercado?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500 mb-3 pb-2 border-b border-zinc-800">
        <div />
        <div className="text-center font-medium">OJ1 (Recente)</div>
        <div className="text-center font-medium">OJ2 (Histórico)</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div className="text-zinc-400">λ (média)</div>
        <div className="text-center text-orange-400 font-mono font-bold">{oj1.lambda}/jogo</div>
        <div className="text-center text-orange-400 font-mono font-bold">{oj2.lambda}/jogo</div>
      </div>
      <div className="space-y-1.5">
        {oj1.linhas.map((linha, i) => {
          const o2 = oj2.linhas[i];
          return (
            <div key={linha.linha} className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-zinc-800/40 rounded px-1 -mx-1">
              <div className="text-zinc-400">Over {linha.linha}</div>
              <div className="text-center">
                <span className="text-zinc-300">{linha.prob_over}%</span>
                <span className="text-orange-400 font-mono ml-1">→ {linha.odd_over}</span>
              </div>
              <div className="text-center">
                <span className="text-zinc-300">{o2.prob_over}%</span>
                <span className="text-orange-400 font-mono ml-1">→ {o2.odd_over}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between text-xs">
        <div className="text-zinc-600">Amostra: {amostraOJ1}j / {amostraOJ2}j</div>
        {oddMercado && nomeMercado && (
          <div className="text-zinc-400">Mercado: <span className="text-orange-300 font-mono">{oddMercado}</span> ({nomeMercado})</div>
        )}
      </div>
    </>
  );
}

// ── TABELA 1X2 ──

function Tabela1X2({
  oj1, oj2, amostraOJ1, amostraOJ2, oddMercado,
}: {
  oj1: Odds1X2; oj2: Odds1X2;
  amostraOJ1: number; amostraOJ2: number;
  oddMercado?: number;
}) {
  const linhas = [
    { label: 'Casa', prob1: oj1.casa_prob, odd1: oj1.casa_odd, prob2: oj2.casa_prob, odd2: oj2.casa_odd },
    { label: 'Empate', prob1: oj1.empate_prob, odd1: oj1.empate_odd, prob2: oj2.empate_prob, odd2: oj2.empate_odd },
    { label: 'Fora', prob1: oj1.fora_prob, odd1: oj1.fora_odd, prob2: oj2.fora_prob, odd2: oj2.fora_odd },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500 mb-3 pb-2 border-b border-zinc-800">
        <div />
        <div className="text-center font-medium">OJ1 (Recente)</div>
        <div className="text-center font-medium">OJ2 (Histórico)</div>
      </div>
      <div className="space-y-1.5">
        {linhas.map((l) => (
          <div key={l.label} className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-zinc-800/40 rounded px-1 -mx-1">
            <div className="text-zinc-400 font-medium">{l.label}</div>
            <div className="text-center font-mono text-zinc-300">
              {l.prob1}% → <span className="text-orange-400">{l.odd1}</span>
            </div>
            <div className="text-center font-mono text-zinc-300">
              {l.prob2}% → <span className="text-orange-400">{l.odd2}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-zinc-800 text-xs text-zinc-600">
        Amostra: {amostraOJ1}j / {amostraOJ2}j
      </div>
    </>
  );
}

// ── TABELA BTTS ──

function TabelaBTTS({
  oj1, oj2, amostraOJ1, amostraOJ2, oddMercado,
}: {
  oj1: OddsBTTS; oj2: OddsBTTS;
  amostraOJ1: number; amostraOJ2: number;
  oddMercado?: number;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500 mb-3 pb-2 border-b border-zinc-800">
        <div />
        <div className="text-center font-medium">OJ1 (Recente)</div>
        <div className="text-center font-medium">OJ2 (Histórico)</div>
      </div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-zinc-800/40 rounded px-1 -mx-1">
          <div className="text-zinc-400">Sim</div>
          <div className="text-center font-mono text-zinc-300">
            {oj1.prob_sim}% → <span className="text-orange-400">{oj1.odd_sim}</span>
          </div>
          <div className="text-center font-mono text-zinc-300">
            {oj2.prob_sim}% → <span className="text-orange-400">{oj2.odd_sim}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-zinc-800/40 rounded px-1 -mx-1">
          <div className="text-zinc-400">Não</div>
          <div className="text-center font-mono text-zinc-300">
            {oj1.prob_nao}% → <span className="text-orange-400">{oj1.odd_nao}</span>
          </div>
          <div className="text-center font-mono text-zinc-300">
            {oj2.prob_nao}% → <span className="text-orange-400">{oj2.odd_nao}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-zinc-800 text-xs text-zinc-600">
        Amostra: {amostraOJ1}j / {amostraOJ2}j
      </div>
    </>
  );
}
