/**
 * GET /api/dashboard/{eventId}
 * Retorna dados completos do jogo + odds justas calculadas
 * Cache: revalidate 15 minutos
 */

import { gerarCardsMercado } from '@/lib/odds-jtsa';

const BSD_TOKEN = process.env.BSD_TOKEN || '';
const BASE_URL = 'https://sports.bzzoiro.com/api';

export const maxDuration = 30;

async function fetchBSD(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Token ${BSD_TOKEN}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`BSD HTTP ${res.status}`);
  return res.json();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const id = parseInt(eventId);
    if (isNaN(id)) {
      return Response.json({ error: 'eventId inválido' }, { status: 400 });
    }

    // Busca dados do jogo + odds comparadas em paralelo
    const [jogoData, oddsData] = await Promise.all([
      fetchBSD(`/events/${id}/`),
      fetchBSD(`/odds/compare/?event=${id}`).catch(() => null),
    ]);

    if (!jogoData || jogoData.error) {
      return Response.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Extrai dados do jogo
    const homeForm = jogoData.home_form || {};
    const awayForm = jogoData.away_form || {};
    const referee = jogoData.referee || {};
    const h2h = jogoData.head_to_head || {};
    const unavailable = jogoData.unavailable_players || {};

    // Calcula odds justas (com nomes dos times)
    const cardsMercado = gerarCardsMercado(
      homeForm, awayForm, jogoData,
      jogoData.home_team, jogoData.away_team
    );

    // Extrai odds do mercado para comparação
    const oddsMercado: Record<string, any> = {};
    if (oddsData?.markets) {
      for (const [mercado, outcomes] of Object.entries(oddsData.markets as Record<string, any>)) {
        oddsMercado[mercado] = {};
        for (const [outcome, data] of Object.entries(outcomes)) {
          oddsMercado[mercado][outcome] = {
            melhor_odd: (data as any).best_odds,
            melhor_casa: (data as any).best_bookmaker,
            pinnacle_odd: (data as any).bookmakers?.Pinnacle?.decimal,
          };
        }
      }
    }

    const resultado = {
      jogo: {
        event_id: jogoData.id,
        data: jogoData.event_date,
        liga: jogoData.league?.name,
        pais: jogoData.league?.country,
        rodada: jogoData.round_number,
        time_casa: jogoData.home_team,
        time_fora: jogoData.away_team,
        status: jogoData.status,
      },
      odds_consenso: {
        vitoria_casa: jogoData.odds_home,
        empate: jogoData.odds_draw,
        vitoria_fora: jogoData.odds_away,
        over_25: jogoData.odds_over_25,
        btts_sim: jogoData.odds_btts_yes,
      },
      odds_mercado: oddsMercado,
      cards_mercado: cardsMercado,
      forma_casa: {
        ultimos_jogos: homeForm.form_string,
        ppg_casa: homeForm.home_ppg,
        gols_marcados_casa: homeForm.home_goals_scored,
        gols_sofridos_casa: homeForm.home_goals_conceded,
      },
      forma_fora: {
        ultimos_jogos: awayForm.form_string,
        ppg_fora: awayForm.away_ppg,
        gols_marcados_fora: awayForm.away_goals_scored,
        gols_sofridos_fora: awayForm.away_goals_conceded,
      },
      h2h: {
        total_jogos: h2h.total_matches,
        vitorias_casa: h2h.home_wins,
        empates: h2h.draws,
        vitorias_fora: h2h.away_wins,
        media_gols: h2h.avg_total_goals,
      },
      arbitro: {
        nome: referee.name,
        amarelos_jogo: referee.yellowCards,
        vermelhos_jogo: referee.redCards,
      },
      desfalques_casa: (unavailable.home || []).map((j: any) => j.name || j),
      desfalques_fora: (unavailable.away || []).map((j: any) => j.name || j),
    };

    return Response.json(resultado, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
