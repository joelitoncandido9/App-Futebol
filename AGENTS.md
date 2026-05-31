<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Memória do Projeto — App-Futebol

## Stack
- Next.js 16, React 19, Tailwind 4, shadcn/ui, TypeScript
- Hospedagem: GitHub + Vercel
- CSS: dark-only, sem suporte a light mode
- Design System próprio: glassmorphism, shimmer animado, score-pop, fade-up
- Fontes: Outfit (headings) + Plus Jakarta Sans (body) via next/font/google

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
- `lib/dixon-coles.ts` — modelo Dixon-Coles em TS com parâmetros de `ml/params/dixon_coles_params.json`
- `lib/openrouter.ts` — streaming com tool calling via OpenRouter
- `app/api/jogos/route.ts` — rota API jogos (usa BSD_TOKEN)
- `app/api/dashboard/[eventId]/route.ts` — rota API dashboard (usa BSD_TOKEN)

## ML
- `ml/src/predict.py` — script Python executado diariamente via GitHub Actions
- Depende de `ml/data/ml_data.json` (não existe — CI quebra)
- `ml/params/dixon_coles_params.json` — parâmetros do modelo Dixon-Coles

## CI/CD
- `.github/workflows/daily-predictions.yml` — roda `python ml/src/predict.py` diariamente

## Pendências (14 itens pendentes / 3 concluídos)
Ver `tarefas pendentes/pendencias.md` para lista completa.

## Skills instaladas (globais em ~/.agents/skills/)
- improve-codebase-architecture (mattpocock/skills)
- frontend-design (anthripics/skills)
- next-best-practices (vercel-labs/next-skills)
- shadcn (shadcn/ui)
- vercel-react-best-practices (vercel-labs/agent-skills)
- tdd (mattpocock/skills)

### Uso das skills
Skills são carregadas sob demanda via `skill` tool pelo assistente, conforme a tarefa:
- **next-best-practices** — edição de Next.js (pages, layouts, rotas, metadata)
- **shadcn** — adição/modificação de componentes shadcn/ui
- **vercel-react-best-practices** — componentes React/performance
- **frontend-design** — criação/melhoria de UI
- **improve-codebase-architecture** — refatoração de arquitetura
- **tdd** — escrita de testes
- Nenhuma skill é carregada automaticamente (economia de tokens)

## Convenções
- Respostas em português do Brasil
- Skills não versionadas no projeto (instalação global)
- Skills carregadas manualmente pelo assistente via `skill` tool quando necessário
- Preferir editar arquivos existentes, não criar novos sem necessidade
- Não adicionar comentários em código

## Design System (redesign 31/05/2026)
- **Direção:** "Premium Data" — fintech encontra esportes. Glassmorphism, dark profundo, tipografia refinada
- **Cores:** Fundo `#0c0c14`, cards com `backdrop-blur`, primary laranja queimado `oklch(0.68 0.2 45)`
- **Glass:** `.glass` (bg 70% opacity + blur 20px), `.glass-strong` (85% + blur 32px)
- **Animações:** `shimmer` (skeleton), `score-pop` (placar), `fade-up` (cards), `glow-pulse`
- **Layout:** `max-w-2xl` mobile-first, padding `px-3` mobile, `px-4` desktop
- **Navegação:** Página única sem abas (nada de Dashboard vs Chat separados)

## Componentes

### `components/JogosLista.tsx`
Lista de jogos com busca, filtro por liga em pills, abas de dia, paginação.
- **Props:** `onSelectJogo: (eventId: number) => void`
- **Design:** Cards glass com scoreboard compacto, times em vertical, odds à direita
- Animações: fade-up staggered com `animation-delay` por índice
- Seções: Ao Vivo, Finalizados Hoje, Sem Resultado, Próximos Jogos

### `components/DashboardJogo.tsx`
Dashboard completo de um jogo em página única (sem accordion/colapsáveis).
- **Props:** `eventId: number`
- **MatchHeader:** Estilo TV broadcast — scores gigantes com glow no vencedor, barra de probabilidade horizontal, informações do estádio/clima
- **Seções** (sempre abertas, SectionBox sem collapse): MatchAnalytics, IncidentesTimeline, PlayerStatsTabela, Lineups, FormWidgets, StatsTable, H2H, UltimosJogos, StandingsTable, MercadosAgrupados, MarketOdds, Coaches, Referee

### `components/ChatInterface.tsx`
Chat com agente analista via SSE + OpenRouter.
- **Props:** `eventId?: number`, `timeCasa?: string`, `timeFora?: string`
- Modos: Analista (`🔍`) e Validador (`✅`)
- Streaming de resposta com status de ferramentas
- **Inline:** Aparece no final do dashboard via botão expansivo (não em aba separada)

### `components/MercadosAgrupados.tsx`
Odds justas agrupadas por categoria (Ataque, Defesa, Disciplina, Criação, Mercados).
- **Props:** `cards: CardData[]`, `oddsConsenso?: Record<string, number | null>`
- **Design:** Cards glass, odds com barras de probabilidade visuais (`ProbBar`), pills 1X2 com gradiente de fundo

### `components/MatchAnalytics.tsx`
Abas de análise avançada: Estatísticas, Shotmap, xG Timeline, Pressão.
- **Props:** `statsAvancadas`, `shotmap`, `xgPorMinuto`, `momentum`, `averagePositions`, `timeCasa`, `timeFora`
- **Design:** Pills de seleção glass (não tabs tradicionais)

### `components/ErrorBoundary.tsx`
Error boundary genérico para capturar erros em componentes filhos.
- **Props:** `children`, `fallback?: ReactNode`, `onError?: (error, info) => void`
- Fallback padrão: box estilizado dark com mensagem de erro

### `components/SkeletonCard.tsx`
Skeletons para estados de carregamento.
- **Design:** Usa `animate-shimmer` (gradient animado) ao invés de `animate-pulse`
- `SkeletonLista` — simula busca + abas + cards
- `SkeletonDashboard` — simula header TV + seções glass
- `SkeletonCard` — card individual com `lines` prop

### `lib/utils.ts`
Utilitários compartilhados:
- `cn(...inputs)` — merge de classes Tailwind (clsx + tailwind-merge)
- `formatarHora(dataStr)` — HH:mm em BRT
- `formatarData(dataStr)` — "segunda-feira, 31 de maio"
- `formatarDataCompleta(dataStr)` — com ano e hora
- `formatarDataCurta(dataStr)` — DD/MM

### `lib/schemas.ts`
Schemas Zod para validação de API:
- `jogosQuerySchema` — `{ liga?: string }`
- `dashboardParamsSchema` — `{ eventId: number }`

### `components/ui/`
Primitivas shadcn/ui: Badge, Button, Card, Select, Separator, Skeleton, Table, Tabs.
