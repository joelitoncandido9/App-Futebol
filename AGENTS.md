<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Memória do Projeto — App-Futebol

## Stack
- Next.js 16, React 19, Tailwind 4, shadcn/ui, TypeScript
- Hospedagem: GitHub + Vercel
- CSS: dark-only, sem suporte a light mode

## APIs externas
- **BSD API** (sports.bzzoiro.com/api) — dados esportivos, v1 + v2
  - Token via `process.env.BSD_TOKEN`
- **OpenRouter** — agente analista com tool calling (modelo `openai/gpt-oss-120b:free`)
  - Key via `process.env.OPENROUTER_API_KEY`
- **Upstash Redis** — cache opcional via `KV_REST_API_URL` + `KV_REST_API_TOKEN`

## Variáveis de ambiente (`.env.example` criado)
- `BSD_TOKEN` — obrigatório
- `OPENROUTER_API_KEY` — obrigatório para o chat
- `KV_REST_API_URL` — opcional
- `KV_REST_API_TOKEN` — opcional

## Arquitetura
- `lib/bsd-tools.ts` — tools BSD API (v1+v2), ~37KB, usada via function calling OpenRouter
- `lib/bsd-stats.ts` — pipeline v2 de estatísticas históricas por time
- `lib/bsd-cache.ts` — cache Upstash Redis com fallup
- `lib/odds-jtsa.ts` — cálculo de odds justas (Poisson)
- `lib/dixon-cales.ts` — modelo Dixon-Coles em TS com parâmetros de `ml/params/dixon_coles_params.json`
- `lib/openrouter.ts` — streaming com tool calling via OpenRouter
- `app/api/jogos/route.ts` — rota API jogos (usa BSD_TOKEN)
- `app/api/dashboard/[eventId]/route.ts` — rota API dashboard (usa BSD_TOKEN)

## ML
- `ml/src/predict.py` — script Python executado diariamente via GitHub Actions
- Depende de `ml/data/ml_data.json` (não existe — CI quebra)
- `ml/params/dixon_coles_params.json` — parâmetros do modelo Dixon-Coles

## CI/CD
- `.github/workflows/daily-predictions.yml` — roda `python ml/sre/predict.py` diariamente

## Pendências (16 itens)
Ver `tarefas pendentes/pendencias.md` para lista completa.

## Skills instaladas (globais em ~/.agents/skills/)
- improve-codebase-architecture (mattpocock/skills)
- frontend-design (anthripics/skills)
- next-best-practices (vercel-labs/next-skills)
- shadcn (shadcn/ui)
- vercel-react-best-practices (vercel-labs/agent-skills)
- tdd (mattpocock/skills)

## Convenções
- Respostas em português do Brasil
- Skills não versionadas no projeto (instalação global)
- Preferir editar arquivos existentes, não criar novos sem necessidade
- Não adicionar comentários em código
