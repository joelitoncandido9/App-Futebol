'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LinhaOU {
  linha: number;
  prob_over: number;
  odd_over: number;
  prob_under: number;
  odd_under: number;
}

interface OddsContagem {
  lambda: number;
  linhas: LinhaOU[];
}

interface CardData {
  titulo: string;
  tipo: string;
  time_casa: string;
  time_fora: string;
  odds_casa?: OddsContagem;
  odds_fora?: OddsContagem;
  odds_combinado?: OddsContagem;
  amostra_casa: number;
  amostra_fora: number;
  odds_1x2?: any;
  odds_btts?: any;
}

interface MercadosAgrupadosProps {
  cards: CardData[];
  oddsConsenso?: Record<string, number | null>;
}

const CATEGORIAS: Record<string, { label: string; icon: string; mercados: string[] }> = {
  ataque: {
    label: 'Ataque', icon: '⚡',
    mercados: ['GOLS', 'FINALIZAÇÕES', 'CHUTES NO GOL', 'CHUTES (dentro área)', 'GRANDES CHANCES', 'GOLS ESPERADOS (xG)'],
  },
  defesa: {
    label: 'Defesa', icon: '🛡️',
    mercados: ['DESARMES', 'INTERCEPTAÇÕES', 'DEFESAS (goleiro)', 'DUELOS AÉREOS'],
  },
  disciplina: {
    label: 'Disciplina', icon: '📋',
    mercados: ['FALTAS', 'CARTÕES', 'CARTÕES VERMELHOS', 'IMPEDIMENTOS'],
  },
  criacao: {
    label: 'Criação', icon: '🎯',
    mercados: ['PASSES-CHAVE (por time)', 'CRUZAMENTOS', 'DRIBES', 'ESCANTEIOS'],
  },
  mercados: {
    label: 'Mercados', icon: '🤖',
    mercados: ['1X2', 'AMBOS MARCAM'],
  },
};

function ProbBar({ prob, color = 'bg-primary' }: { prob: number; color?: string }) {
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(prob, 100)}%` }} />
    </div>
  );
}

function OddPill({ label, prob, odd, color }: { label: string; prob: number; odd: string; color: string }) {
  return (
    <div className={`rounded-lg p-3 text-center border ${color}`}>
      <div className="text-[10px] font-semibold mb-1 opacity-80">{label}</div>
      <div className="font-mono text-sm font-black text-foreground">{prob}%</div>
      <ProbBar prob={prob} color="bg-primary/60" />
      <div className="text-primary font-mono text-[10px] font-bold mt-1">OJ: {odd}</div>
    </div>
  );
}

export default function MercadosAgrupados({ cards, oddsConsenso }: MercadosAgrupadosProps) {
  if (!cards || cards.length === 0) return null;

  const card1x2 = cards.find((c) => c.tipo === '1x2');
  const cardBtts = cards.find((c) => c.tipo === 'btts');

  function cardsDaCategoria(mercados: string[]) {
    return cards.filter((c) => c.tipo === 'contagem_dupla' && mercados.includes(c.titulo));
  }

  return (
    <div className="space-y-5">
      {Object.entries(CATEGORIAS).map(([key, cat]) => (
        <div key={key}>
          <h4 className="text-foreground/80 text-[11px] font-bold mb-3 flex items-center gap-2">
            <span className="h-px flex-1 bg-border/50" />
            <span>{cat.icon} {cat.label}</span>
            <span className="h-px flex-1 bg-border/50" />
          </h4>

          {key === 'mercados' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {card1x2 && card1x2.odds_1x2 && (
                <div className="glass rounded-xl p-3.5">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3">1X2</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <OddPill
                      label={card1x2.time_casa}
                      prob={card1x2.odds_1x2.casa_prob}
                      odd={card1x2.odds_1x2.casa_odd}
                      color="border-green-800/30 bg-green-900/15"
                    />
                    <OddPill
                      label="Empate"
                      prob={card1x2.odds_1x2.empate_prob}
                      odd={card1x2.odds_1x2.empate_odd}
                      color="border-yellow-800/30 bg-yellow-900/15"
                    />
                    <OddPill
                      label={card1x2.time_fora}
                      prob={card1x2.odds_1x2.fora_prob}
                      odd={card1x2.odds_1x2.fora_odd}
                      color="border-blue-800/30 bg-blue-900/15"
                    />
                  </div>
                </div>
              )}
              {cardBtts && cardBtts.odds_btts && (
                <div className="glass rounded-xl p-3.5">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3">Ambos Marcam</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <OddPill
                      label="Sim"
                      prob={cardBtts.odds_btts.prob_sim}
                      odd={cardBtts.odds_btts.odd_sim}
                      color="border-green-800/30 bg-green-900/15"
                    />
                    <OddPill
                      label="Não"
                      prob={cardBtts.odds_btts.prob_nao}
                      odd={cardBtts.odds_btts.odd_nao}
                      color="border-red-800/30 bg-red-900/15"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {cardsDaCategoria(cat.mercados).map((card) => {
                const oc = card.odds_casa;
                const of = card.odds_fora;
                const ox = card.odds_combinado;
                const mediaTotal = (oc?.lambda ?? 0) + (of?.lambda ?? 0);

                return (
                  <div key={card.titulo} className="glass rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary">{card.titulo}</h5>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                        <span>{card.time_casa}: <span className="font-mono font-bold text-foreground/80">{oc?.lambda ?? '-'}</span></span>
                        <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded font-mono">Total: {mediaTotal.toFixed(1)}</span>
                        <span>{card.time_fora}: <span className="font-mono font-bold text-foreground/80">{of?.lambda ?? '-'}</span></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left text-muted-foreground font-medium py-1.5 pr-2 w-14">Linha</th>
                            <th className="text-right text-muted-foreground font-medium py-1.5 px-2">Prob</th>
                            <th className="text-right text-muted-foreground font-medium py-1.5 px-2 w-14">OJ</th>
                            <th className="text-right text-muted-foreground font-medium py-1.5 px-2 w-16">OJ {card.time_casa.substring(0, 4)}</th>
                            <th className="text-right text-muted-foreground font-medium py-1.5 px-2 w-12">{card.time_casa.substring(0, 4)}</th>
                            <th className="text-right text-muted-foreground font-medium py-1.5 px-2 w-16">OJ {card.time_fora.substring(0, 4)}</th>
                            <th className="text-right text-muted-foreground font-medium py-1.5 px-2 w-12">{card.time_fora.substring(0, 4)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ox?.linhas.map((lx, i) => {
                            const lc = oc?.linhas[i]; const lf = of?.linhas[i];
                            return (
                              <tr key={`${lx.linha}`} className="border-b border-border/15 hover:bg-green-900/10">
                                <td className="py-1.5 pr-2"><span className="text-green-400 font-semibold">O{lx.linha}</span></td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-foreground/80">
                                  {lx.prob_over}%
                                  <ProbBar prob={lx.prob_over} color="bg-green-500/50" />
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-primary">{lx.odd_over}</td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-green-400">{lc?.odd_over}</td>
                                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{lc?.prob_over}%</td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-blue-400">{lf?.odd_over}</td>
                                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{lf?.prob_over}%</td>
                              </tr>
                            );
                          })}
                          {ox?.linhas.map((lx, i) => {
                            const lc = oc?.linhas[i]; const lf = of?.linhas[i];
                            return (
                              <tr key={`u-${lx.linha}`} className="border-b border-border/15 hover:bg-red-900/10">
                                <td className="py-1.5 pr-2"><span className="text-red-400 font-semibold">U{lx.linha}</span></td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-foreground/80">
                                  {lx.prob_under}%
                                  <ProbBar prob={lx.prob_under} color="bg-red-500/50" />
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-primary">{lx.odd_under}</td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-green-400">{lc?.odd_under}</td>
                                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{lc?.prob_under}%</td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-blue-400">{lf?.odd_under}</td>
                                <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{lf?.prob_under}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
