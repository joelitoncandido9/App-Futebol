# Instruções — Validador

## Como testar o agente

### Pelo chat da aplicação
1. Execute o projeto: `npm run dev`
2. Abra http://localhost:3000
3. Selecione o modo **✅ Validador**
4. Cole um palpite do Analista e peça validação

### Requisitos
- `OPENROUTER_API_KEY` configurada no `.env.local`
- `BSD_TOKEN` configurado no `.env.local`
- `TAVILY_API_KEY` (opcional, para web search)

## Tools disponíveis para este agente

| Tool | Descrição |
|------|-----------|
| `buscar_na_web(query)` | Pesquisa na web para validar contexto (lesões, clima, notícias) |
| `buscar_jogo()` | Encontra jogos por nome dos times |
| `analisar_jogo(event_id)` | Dados completos do jogo (H2H, forma, técnicos) |
| `buscar_predicao_v2(event_id)` | Predição ML CatBoost |
| `comparar_odds(event_id)` | Odds de mercado (Pinnacle, Bet365, etc.) |
| `buscar_historico_arbitro(nome)` | Perfil do árbitro |

## O que o Validador faz

- ✅ Valida contexto do jogo (lesões, clima, arbitragem, motivação)
- ✅ Verifica consistência dos dados históricos
- ✅ Compara odd justa vs odd de mercado (Pinnacle優先)
- ✅ Recalcula EV de forma independente
- ✅ Emite veredito: APROVADO | ATENÇÃO | REJEITADO
- ✅ Sugere alternativas se o palpite for rejeitado

## Arquivos

- `prompt.md` — Prompt completo do validador
- `../../lib/system-prompt-validador.ts` — Versão em TypeScript do prompt (usada no código)
- `../../lib/bsd-tools.ts` — Tools BSD + web search
- `../../lib/openrouter.ts` — Integração com OpenRouter
