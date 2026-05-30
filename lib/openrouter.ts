/**
 * Cliente OpenRouter para streaming com tool calling
 * Modelo: openai/gpt-oss-120b:free (gratuito)
 */

import { toolDeclarations, executar_function_call } from './bsd-tools';
import { SYSTEM_PROMPT } from './system-prompt';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b:free';

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Faz uma chamada ao OpenRouter com streaming e processa tool calls em loop.
 * Retorna um ReadableStream com eventos SSE.
 */
export function chatStream(messages: { role: string; content: string }[], eventId?: number) {
  const fullMessages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    // Se tiver eventId, adiciona contexto do jogo
    ...(eventId
      ? [{ role: 'system' as const, content: `Contexto: o usuário está vendo o jogo event_id=${eventId} no dashboard. Use as tools BSD se precisar de dados complementares.` }]
      : []),
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        await processLoop(fullMessages, controller, encoder);
      } catch (error: any) {
        const msg = JSON.stringify({ type: 'error', content: error.message || 'Erro interno' });
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
      } finally {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      }
    },
  });
}

async function processLoop(
  messages: Message[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  depth = 0
): Promise<void> {
  if (depth > 8) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool', message: '⚠️ Muitas ferramentas chamadas em sequência. Finalizando...' })}\n\n`));
    return;
  }

  // Faz requisição ao OpenRouter
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      'X-Title': 'Agente Analista Futebol',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages.map((m) => {
        // Tool messages no formato OpenAI
        if (m.role === 'tool') {
          return { role: 'tool', content: m.content, tool_call_id: m.tool_call_id };
        }
        if (m.role === 'assistant' && m.tool_calls) {
          return { role: 'assistant', content: m.content || null, tool_calls: m.tool_calls };
        }
        return { role: m.role, content: m.content };
      }),
      tools: toolDeclarations,
      tool_choice: 'auto',
      stream: true,
      max_tokens: 4000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Resposta sem body');

  // Acumulador para tool calls (streaming pode vir em múltiplos chunks)
  let toolCalls: Map<number, { id: string; name: string; args: string }> = new Map();
  let fullContent = '';

  // Lê o stream
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const jsonStr = trimmed.slice(6).trim();
      if (jsonStr === '[DONE]') continue;

      try {
        const chunk = JSON.parse(jsonStr);
        const delta = chunk.choices?.[0]?.delta;

        // Texto do assistente
        if (delta?.content) {
          fullContent += delta.content;
          // Envia chunks de texto como SSE para o frontend
          const event = JSON.stringify({ type: 'text', content: delta.content });
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        }

        // Tool calls
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const index = tc.index ?? 0;
            if (!toolCalls.has(index)) {
              toolCalls.set(index, { id: tc.id || '', name: '', args: '' });
            }
            const existing = toolCalls.get(index)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name += tc.function.name;
            if (tc.function?.arguments) existing.args += tc.function.arguments;
          }
        }
      } catch {
        // ignora chunks mal formados
      }
    }
  }

  // Verifica se houve tool calls
  if (toolCalls.size > 0) {
    // Constrói a mensagem do assistente com as tool calls
    const toolCallsArray: ToolCall[] = [];
    for (const [, tc] of toolCalls) {
      toolCallsArray.push({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.args },
      });
    }

    messages.push({
      role: 'assistant',
      content: fullContent || null,
      tool_calls: toolCallsArray,
    });

    // Executa cada tool call
    for (const tc of toolCallsArray) {
      let args: any = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch { /* mantém vazio */ }

      // Notifica o frontend
      const toolEvent = JSON.stringify({
        type: 'tool',
        message: `🔧 Buscando ${tc.function.name}...`,
      });
      controller.enqueue(encoder.encode(`data: ${toolEvent}\n\n`));

      // Executa a tool
      const result = await executar_function_call(tc.function.name, args);

      messages.push({
        role: 'tool',
        content: result,
        tool_call_id: tc.id,
        name: tc.function.name,
      });
    }

    // Continua o loop com os resultados das tools
    await processLoop(messages, controller, encoder, depth + 1);
  } else if (fullContent) {
    // Sem tool calls, só texto — já foi enviado via streaming
    return;
  }
}
