import { NextRequest } from 'next/server';

const BSD_TOKEN = process.env.BSD_TOKEN || '';
const BASE_URL = 'https://sports.bzzoiro.com/api';

/**
 * GET /api/jogos
 * Retorna lista de jogos do dia + próximos 7 dias
 * Cache: revalidate 30 minutos
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const liga = searchParams.get('liga');

  const hoje = new Date().toISOString().split('T')[0];
  const semana = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const params = new URLSearchParams({
    date_from: hoje,
    date_to: semana,
    tz: 'America/Sao_Paulo',
  });

  const url = `${BASE_URL}/events/?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Token ${BSD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 1800 }, // 30 minutos de cache
    });

    if (!res.ok) {
      return Response.json(
        { error: `BSD API retornou HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const jogos = (data.results || [])
      .filter((ev: any) => ev.status === 'notstarted' || ev.status === 'halftime')
      .map((ev: any) => ({
        event_id: ev.id,
        data: ev.event_date,
        liga: ev.league?.name || 'Desconhecida',
        pais: ev.league?.country || '',
        time_casa: ev.home_team || 'Time A',
        time_fora: ev.away_team || 'Time B',
        status: ev.status,
        odd_casa: ev.odds_home,
        odd_empate: ev.odds_draw,
        odd_fora: ev.odds_away,
        league_id: ev.league?.id,
      }));

    // Filtra por liga se especificado
    const resultado = liga
      ? jogos.filter((j: any) => j.liga.toLowerCase().includes(liga.toLowerCase()))
      : jogos;

    return Response.json({ jogos: resultado, total: resultado.length }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Erro ao buscar jogos' },
      { status: 500 }
    );
  }
}
