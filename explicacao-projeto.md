# App-Futebol — Agente Analista ⚽

## Visão Geral

O **App-Futebol** é uma plataforma web de análise esportiva construída com **Next.js 16**, **React 19**, **Tailwind 4** e **shadcn/ui**. Seu objetivo é fornecer odds justas, estatísticas detalhadas e inteligência artificial especializada para jogos de futebol, com foco no futebol brasileiro e principais ligas europeias. O projeto está hospedado no **GitHub** e deployado na **Vercel**, utilizando exclusivamente tema **dark**.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind 4, shadcn/ui |
| Linguagem | TypeScript (strict) |
| Testes | Vitest, Testing Library |
| Fontes | Inter via Google Fonts |
| CSS | dark-only (sem suporte a light mode) |
| Monitoramento | Sentry (client + server + edge) |
| Cache | Upstash Redis (opcional) |

---

## APIs Externas

### BSD API (`sports.bzzoiro.com/api`)
API de dados esportivos em duas versões:
- **v1** — dados principais (eventos, odds, form, h2h, incidents, lineups, stats, coach, referee)
- **v2** — dados estendidos (predição ML, player-stats, metadata, broadcasts, histórico de times)
- Autenticação via token `BSD_TOKEN`

### OpenRouter
- Agente analista com **tool calling** usando o modelo gratuito `openai/gpt-oss-120b:free`
- Streaming de respostas via **Server-Sent Events (SSE)**
- Três modos de agente: **Analista** (🔍), **Validador** (✅), e modo padrão
- Chave via `OPENROUTER_API_KEY`

### Upstash Redis
- Cache opcional para requisições à BSD API (TTL de 15 min para dashboard, 30 min para jogos)

---

## Arquitetura do Projeto

```
App-Futebol/
├── app/
│   ├── api/
│   │   ├── jogos/route.ts              # GET — lista de jogos (7 dias)
│   │   ├── dashboard/[eventId]/route.ts # GET — dados completos de 1 jogo
│   │   └── chat/route.ts               # POST — streaming SSE com tool calling
│   ├── page.tsx                        # Página principal (SPA)
│   ├── layout.tsx                      # Root layout com fontes e metadata
│   └── globals.css                     # Estilos globais Tailwind
├── components/
│   ├── JogosLista.tsx                  # Lista de jogos com busca/filtro/abas/paginação
│   ├── DashboardJogo.tsx               # Dashboard completo de um jogo
│   ├── ChatInterface.tsx               # Chat com agente analista
│   ├── MatchAnalytics.tsx              # Abas de análise avançada
│   ├── MercadosAgrupados.tsx           # Odds justas agrupadas por categoria
│   ├── StatsAvancadas.tsx              # Estatísticas avançadas da partida
│   ├── IncidentesTimeline.tsx          # Timeline de incidentes
│   ├── PlayerStatsTabela.tsx           # Tabela de estatísticas por jogador
│   ├── ShotmapDisplay.tsx              # Mapa de chutes
│   ├── UltimosJogos.tsx                # Últimos jogos de cada time
│   ├── ErrorBoundary.tsx               # Error boundary genérico
│   ├── SkeletonCard.tsx                # Skeletons para loading
│   ├── LoadingIndicator.tsx            # Spinner (legado)
│   └── ui/                             # Primitivas shadcn/ui
│       ├── badge.tsx, button.tsx, card.tsx, select.tsx
│       ├── separator.tsx, skeleton.tsx, table.tsx, tabs.tsx
├── lib/
│   ├── bsd-tools.ts                    # Tools BSD API para function calling (OpenRouter)
│   ├── bsd-stats.ts                    # Pipeline v2 de estatísticas históricas
│   ├── bsd-cache.ts                    # Cache Upstash Redis com fallback
│   ├── openrouter.ts                   # Cliente OpenRouter com streaming + tool calling
│   ├── odds-jtsa.ts                    # Cálculo de odds justas (Poisson, BTTS, 1X2)
│   ├── dixon-coles.ts                  # Modelo Dixon-Coles em TS para predição 1X2
│   ├── system-prompt.ts                # Prompt principal do agente
│   ├── system-prompt-analista.ts       # Prompt modo analista
│   ├── system-prompt-validador.ts      # Prompt modo validador
│   ├── utils.ts                        # Utilitários (formatação, cn)
│   └── schemas.ts                      # Schemas Zod para validação de API
├── ml/
│   ├── src/predict.py                  # Script Python de predições diárias
│   ├── data/ml_data.json               # Dados históricos para ML (não existe — CI quebra)
│   ├── params/dixon_coles_params.json  # Parâmetros Dixon-Coles (25 temporadas)
│   └── predictions/daily.json          # Predições geradas pelo script
├── public/                             # Assets estáticos
├── test/                               # Testes (Vitest)
│   ├── ErrorBoundary.test.tsx
│   ├── utils.test.ts
│   └── setup.ts
├── .github/workflows/
│   └── daily-predictions.yml           # CI/CD — roda predict.py diariamente às 06:00 BRT
├── tarefas pendentes/pendencias.md     # Gerenciamento de tarefas
├── AGENTS.md                           # Memória do projeto para o assistente
├── components.json                     # Configuração shadcn/ui
├── next.config.ts                      # Config Next.js + Sentry
├── vitest.config.ts                    # Config Vitest
└── vercel.json                         # Config Vercel (maxDuration por rota)
```

---

## Funcionalidades Principais

### 1. Lista de Jogos (`/api/jogos`)
- Busca jogos do dia + próximos 7 dias via BSD API v1
- Filtro por liga
- Abas por dia (Hoje + 6 dias) com paginação (5 grupos/página)
- Seções: Ao Vivo, Finalizados Hoje, Sem Resultado, Próximos Jogos
- Cache de 30 minutos (`s-maxage=1800`)

### 2. Dashboard de Jogo (`/api/dashboard/[eventId]`)
Endpoint que retorna dados completos agregando v1 + v2 BSD:

**Dados do Jogo:**
- event_id, data, liga, país, rodada, times (casa/fora), status
- Placar (final + HT), período atual, minuto
- xG ao vivo (casa/fora)
- Contexto: clássico local, distância de viagem, campo neutro
- Estádio (nome, cidade, capacidade), clima, condição do gramado, uniformes

**Odds:**
- Odds consenso (1X2, Over/Under 1.5/2.5/3.5, BTTS)
- Odds de mercado com comparação entre casas (incluindo Pinnacle)
- Cards de odds justas calculadas (15+ mercados)

**Forma dos Times:**
- PPG (casa/fora), gols marcados/sofridos, clean sheets
- Médias por jogo: chutes, chutes no gol, faltas, cartões amarelos/vermelhos, xG, xG sofrido, passes-chave, rating
- Vitórias/empates/derrotas

**Técnicos:**
- Nome, formação preferida, intensidade de pressing, linha defensiva, top estilos

**Árbitro:**
- Nome e médias reais de cartões amarelos/vermelhos por jogo

**Histórico (H2H):**
- Total de jogos, vitórias casa/fora, empates, gols, média de gols
- Últimos 10 confrontos

**Classificação:**
- Posição, jogos, vitórias/empates/derrotas, gols pró/contra, saldo, pontos, xG a favor/contra, forma recente

**Análise Avançada:**
- Stats avançadas (posse, passes, dribles, etc.)
- Shotmap (coordenadas de cada chute com xG)
- Momentum (pressão por minuto)
- xG Timeline (evolução minuto a minuto)
- Average Positions (posicionamento médio)
- Incidentes (gols, cartões, substituições em timeline)
- Lineups (escalações com substitutos)
- Player Stats (rating, gols, passes, tackles, etc. por jogador)

**ML & Dados Extras:**
- Predição ML v2 (probabilidades, xG esperado, O/U, BTTS, placar provável, recomendações)
- Desfalques (jogadores indisponíveis)
- Transmissões TV (país + canal)
- Metadata (fatos curiosos, preview IA)
- Últimos 10 jogos de cada time

### 3. Odds Justas (`lib/odds-jtsa.ts`)
Cálculo probabilístico **apenas com dados reais**, sem suavização, sem priors Bayesianos:

- **Contagem (Poisson)**: gols, finalizações, chutes no gol, cartões, faltas, xG, passes-chave, escanteios, impedimentos, desarmes, interceptações, cruzamentos, dribles, duelos aéreos, defesas, cartões vermelhos, grandes chances, chutes dentro da área
- Para cada mercado: λ calculado como `total_eventos / total_jogos`, probabilidades Over/Under para múltiplas linhas
- **1X2**: Poisson bivariada com placar máximo 5-5
- **BTTS**: probabilidade empírica baseada em clean sheets

### 4. Modelo Dixon-Coles (`lib/dixon-coles.ts`)
- Predição 1X2 baseada em forças de ataque/defesa por liga
- Parâmetros treinados com **25 temporadas** de dados (em `ml/params/dixon_coles_params.json`)
- Suporte a 10 ligas: Brasileirão, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Championship, Eredivisie, Primeira Liga, 2. Bundesliga
- Fator de vantagem caseira por liga
- Mapeamento de nomes BSD → nomes do JSON de parâmetros

### 5. Chat com Agente Analista
Interface de chat com streaming SSE via OpenRouter:
- **Modo Analista** (🔍): análise aprofundada com ferramentas BSD
- **Modo Validador** (✅): validação de palpites do usuário
- Tool calling em loop (máx. 8 iterações) para buscar dados complementares
- Contexto automático do jogo selecionado no dashboard
- Três system prompts especializados

### 6. ML Pipeline (Python)
- Script `ml/src/predict.py` executado **diariamente via GitHub Actions** (06:00 BRT)
- Busca jogos do dia via BSD API v2
- Carrega médias históricas de `ml/data/ml_data.json`
- Gera predições e salva em `ml/predictions/daily.json`
- Comita e faz push automático com `github-actions[bot]`

---

## Testes

- Framework: **Vitest** com jsdom
- Testes existentes: `ErrorBoundary.test.tsx`, `utils.test.ts`
- Setup com Testing Library + jest-dom

---

## CI/CD

- **Vercel**: deploy automático via integração com GitHub
  - `maxDuration`: 60s (chat), 30s (dashboard), 15s (jogos)
- **GitHub Actions** (`daily-predictions.yml`):
  - Cron: `0 9 * * *` (06:00 BRT)
  - Python 3.12, dependência: `requests`
  - Permissão de escrita no repositório

---

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `BSD_TOKEN` | ✅ | Token da API esportiva BSD |
| `OPENROUTER_API_KEY` | ✅ (para chat) | Chave da API OpenRouter |
| `KV_REST_API_URL` | ❌ | URL do Upstash Redis |
| `KV_REST_API_TOKEN` | ❌ | Token do Upstash Redis |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | DSN pública do Sentry (client-side) |
| `SENTRY_DSN` | ❌ | DSN do Sentry server-side |
| `SENTRY_ORG` / `SENTRY_PROJECT` | ❌ | Org e projeto Sentry |

---

## Convenções do Projeto

- **Idioma**: português do Brasil (respostas, prompts, nomes de componentes, variáveis)
- **Estilo**: dark-only, sem suporte a light mode
- **Componentes**: prefere editar arquivos existentes a criar novos
- **Código**: sem comentários em produção (apenas JSDoc descritivo em libs)
- **Skills**: carregadas manualmente sob demanda via ferramenta `skill` (economia de tokens)
- **Cores**: laranja (`orange-500`) como cor de destaque principal
- **Gradiente header**: `from-orange-500 to-orange-600`

---

## Skills Disponíveis (Agentes)

Instaladas globalmente em `~/.agents/skills/`:
- `next-best-practices` — edição de Next.js (pages, layouts, rotas, metadata)
- `shadcn` — adição/modificação de componentes shadcn/ui
- `vercel-react-best-practices` — componentes React/performance
- `frontend-design` — criação/melhoria de UI
- `improve-codebase-architecture` — refatoração de arquitetura
- `tdd` — escrita de testes
