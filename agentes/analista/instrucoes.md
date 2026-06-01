# Instruções — Analista

## Como testar o agente

### Pelo chat da aplicação
1. Execute o projeto: `npm run dev`
2. Abra http://localhost:3000
3. Selecione o modo **🔍 Analista**
4. Digite qualquer pergunta sobre um jogo

### Requisitos
- `OPENROUTER_API_KEY` configurada no `.env.local`
- `BSD_TOKEN` configurado no `.env.local`
- `TAVILY_API_KEY` (opcional, para web search)

## Tools disponíveis para este agente

| Tool | Descrição |
|------|-----------|
| `buscar_na_web(query)` | Pesquisa na web sobre times, campeonatos, notícias |
| `buscar_jogo()` | Encontra jogos por nome dos times |
| `analisar_jogo(event_id)` | Dados completos do jogo |
| `buscar_predicao_v2(event_id)` | Predição ML CatBoost |
| `buscar_player_stats(event_id)` | Stats por jogador |
| `buscar_lineups(event_id)` | Escalações |
| `buscar_metadados(event_id)` | Fatos e preview |
| `buscar_tabela(league_id)` | Classificação |
| `comparar_odds(event_id)` | Odds de mercado |
| `buscar_historico_arbitro(nome)` | Perfil do árbitro |

## O que o Analista cobre

- ✅ Todos os mercados de Ataque (Gols, Finalizações, Chutes no Gol, xG, Grandes Chances, Chutes dentro da área)
- ✅ Todos os mercados de Defesa (Desarmes, Interceptações, Duelos Aéreos, Defesas)
- ✅ Todos os mercados de Disciplina (Cartões, Faltas, Impedimentos, Vermelhos)
- ✅ Todos os mercados de Criação (Escanteios, Cruzamentos, Dribles)
- ✅ Mercados principais (1X2, BTTS)
- ✅ Cálculo de EV apenas quando há odd de mercado
- ✅ Pesquisa web antes dos dados BSD

## Arquivos

- `prompt.md` — Prompt completo do analista
- `../../lib/system-prompt-analista.ts` — Versão em TypeScript do prompt (usada no código)
- `../../lib/bsd-tools.ts` — Tools BSD + web search
- `../../lib/openrouter.ts` — Integração com OpenRouter
