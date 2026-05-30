'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';

// ── Tipos (mesmos do CardMercado) ──

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
}

// Agrupamento dos mercados por categoria
const CATEGORIAS: Record<string, { label: string; icon: string; mercados: string[] }> = {
  ataque: {
    label: 'Ataque',
    icon: '⚡',
    mercados: ['GOLS', 'FINALIZAÇÕES', 'CHUTES NO GOL', 'CHUTES (dentro área)', 'GRANDES CHANCES', 'GOLS ESPERADOS (xG)'],
  },
  defesa: {
    label: 'Defesa',
    icon: '🛡️',
    mercados: ['DESARMES', 'INTERCEPTAÇÕES', 'DEFESAS (goleiro)', 'DUELOS AÉREOS'],
  },
  disciplina: {
    label: 'Disciplina',
    icon: '📋',
    mercados: ['FALTAS', 'CARTÕES', 'CARTÕES VERMELHOS', 'IMPEDIMENTOS'],
  },
  criacao: {
    label: 'Criação',
    icon: '🎯',
    mercados: ['PASSES-CHAVE (por time)', 'CRUZAMENTOS', 'DRIBES', 'ESCANTEIOS'],
  },
  mercados: {
    label: 'Mercados',
    icon: '🤖',
    mercados: ['1X2', 'AMBOS MARCAM'],
  },
};

export default function MercadosAgrupados({ cards }: MercadosAgrupadosProps) {
  if (!cards || cards.length === 0) return null;

  // Encontra os cards de 1X2 e BTTS para a aba Mercados
  const card1x2 = cards.find((c) => c.tipo === '1x2');
  const cardBtts = cards.find((c) => c.tipo === 'btts');

  // Filtra cards de contagem por categoria
  function cardsDaCategoria(mercados: string[]) {
    return cards.filter((c) => c.tipo === 'contagem_dupla' && mercados.includes(c.titulo));
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-foreground/80 font-semibold">🎯 Odds Justas por Mercado</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="ataque">
          <div className="overflow-x-auto mx-4 mb-2">
            <TabsList className="bg-muted/80 w-max">
              {Object.entries(CATEGORIAS).map(([key, cat]) => (
                <TabsTrigger key={key} value={key} className="text-xs whitespace-nowrap">
                  {cat.icon} {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {Object.entries(CATEGORIAS).map(([key, cat]) => (
            <TabsContent key={key} value={key} className="px-4 pb-4 space-y-4">
              {key === 'mercados' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1X2 */}
                  {card1x2 && card1x2.odds_1x2 && (
                    <Card className="border-border">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-xs text-orange-600 font-bold uppercase tracking-wider">1X2</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-green-50 border border-green-200/50 rounded-lg p-3 text-center">
                            <div className="text-green-600 text-[10px] font-semibold mb-1">{cat.mercados[0]?.includes('1X2') ? '' : card1x2.time_casa}</div>
                            <div className="font-mono text-sm font-black text-foreground">{card1x2.odds_1x2.casa_prob}%</div>
                            <div className="text-orange-600 font-mono text-xs font-bold">OJ: {card1x2.odds_1x2.casa_odd}</div>
                            <div className="text-muted-foreground text-[9px] mt-1">{card1x2.time_casa}</div>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200/50 rounded-lg p-3 text-center">
                            <div className="text-yellow-600 text-[10px] font-semibold mb-1">Empate</div>
                            <div className="font-mono text-sm font-black text-foreground">{card1x2.odds_1x2.empate_prob}%</div>
                            <div className="text-orange-600 font-mono text-xs font-bold">OJ: {card1x2.odds_1x2.empate_odd}</div>
                          </div>
                          <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-3 text-center">
                            <div className="text-blue-600 text-[10px] font-semibold mb-1">{cat.mercados[0]?.includes('1X2') ? '' : card1x2.time_fora}</div>
                            <div className="font-mono text-sm font-black text-foreground">{card1x2.odds_1x2.fora_prob}%</div>
                            <div className="text-orange-600 font-mono text-xs font-bold">OJ: {card1x2.odds_1x2.fora_odd}</div>
                            <div className="text-muted-foreground text-[9px] mt-1">{card1x2.time_fora}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Ambos Marcam */}
                  {cardBtts && cardBtts.odds_btts && (
                    <Card className="border-border">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-xs text-orange-600 font-bold uppercase tracking-wider">Ambos Marcam</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-green-50 border border-green-200/50 rounded-lg p-3 text-center">
                            <div className="text-green-600 text-[10px] font-semibold mb-1">Sim</div>
                            <div className="font-mono text-sm font-black text-foreground">{cardBtts.odds_btts.prob_sim}%</div>
                            <div className="text-orange-600 font-mono text-xs font-bold">OJ: {cardBtts.odds_btts.odd_sim}</div>
                          </div>
                          <div className="bg-red-50 border border-red-200/50 rounded-lg p-3 text-center">
                            <div className="text-red-600 text-[10px] font-semibold mb-1">Não</div>
                            <div className="font-mono text-sm font-black text-foreground">{cardBtts.odds_btts.prob_nao}%</div>
                            <div className="text-orange-600 font-mono text-xs font-bold">OJ: {cardBtts.odds_btts.odd_nao}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                // Tabela de contagem dupla para cada mercado
                cardsDaCategoria(cat.mercados).map((card) => {
                  const oc = card.odds_casa;
                  const of = card.odds_fora;
                  const ox = card.odds_combinado;
                  const mediaTotal = (oc?.lambda ?? 0) + (of?.lambda ?? 0);

                  return (
                    <Card key={card.titulo} className="border-border">
                      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-600">
                          {card.titulo}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{card.time_casa}: <span className="font-mono font-bold text-orange-500">{oc?.lambda ?? '-'}</span></span>
                          <Badge variant="outline" className="text-[9px] py-0 h-4 border-orange-200 text-orange-700 font-bold bg-orange-50">
                            Total: {mediaTotal.toFixed(1)}
                          </Badge>
                          <span>{card.time_fora}: <span className="font-mono font-bold text-orange-500">{of?.lambda ?? '-'}</span></span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 overflow-x-auto">
                        <Table className="min-w-[500px]">
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-[10px] h-7 w-14">Linha</TableHead>
                              <TableHead className="text-[10px] h-7 text-right">Prob</TableHead>
                              <TableHead className="text-[10px] h-7 text-right w-14">OJ</TableHead>
                              <TableHead className="text-[10px] h-7 text-right w-16">OJ {card.time_casa.substring(0, 4)}</TableHead>
                              <TableHead className="text-[10px] h-7 text-right w-16">{card.time_casa.substring(0, 4)}%</TableHead>
                              <TableHead className="text-[10px] h-7 text-right w-16">OJ {card.time_fora.substring(0, 4)}</TableHead>
                              <TableHead className="text-[10px] h-7 text-right w-16">{card.time_fora.substring(0, 4)}%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ox?.linhas.map((lx, i) => {
                              const lc = oc?.linhas[i];
                              const lf = of?.linhas[i];
                              return (
                                <TableRow key={`${lx.linha}`} className="border-gray-100 hover:bg-orange-50/30">
                                  <TableCell className="py-1.5 text-[11px]">
                                    <span className="text-green-600 font-semibold">O{lx.linha}</span>
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold">
                                    {lx.prob_over}%
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold text-orange-600">
                                    {lx.odd_over}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold text-green-600">
                                    {lc?.odd_over}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono text-muted-foreground">
                                    {lc?.prob_over}%
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold text-blue-600">
                                    {lf?.odd_over}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono text-muted-foreground">
                                    {lf?.prob_over}%
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {ox?.linhas.map((lx, i) => {
                              const lc = oc?.linhas[i];
                              const lf = of?.linhas[i];
                              return (
                                <TableRow key={`u-${lx.linha}`} className="border-gray-100 hover:bg-red-50/20">
                                  <TableCell className="py-1.5 text-[11px]">
                                    <span className="text-red-600 font-semibold">U{lx.linha}</span>
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold">
                                    {lx.prob_under}%
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold text-orange-600">
                                    {lx.odd_under}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold text-green-600">
                                    {lc?.odd_under}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono text-muted-foreground">
                                    {lc?.prob_under}%
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono font-bold text-blue-600">
                                    {lf?.odd_under}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-[11px] text-right font-mono text-muted-foreground">
                                    {lf?.prob_under}%
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
