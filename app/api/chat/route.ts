/**
 * POST /api/chat
 * Endpoint de streaming com tool calling via OpenRouter
 * Usa Server-Sent Events (SSE) para resposta progressiva
 */

import { chatStream } from '@/lib/openrouter';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, eventId, mode, dashboardData } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Mensagens são obrigatórias' }, { status: 400 });
    }

    // Cria o stream SSE
    const stream = chatStream(messages, eventId || undefined, mode, dashboardData);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Erro interno no chat' },
      { status: 500 }
    );
  }
}
