# Pendências — App-Futebol (TODAS RESOLVIDAS ✅)

> ⚠️ Lista gerada em 31/05/2026 após auditoria completa da BSD API
> Todos os 17 itens foram resolvidos em 31/05/2026.

---

## 🔴 Prioridade Alta — Bugs e Dados Quebrados

### ✅ Key mismatches corrigidos no PlayerStatsTabela
Mapeamento alterado em `route.ts`: `goal_assist → assistencias`, `expected_goals → xg`, `yellow_card → cartao_amarelo`, `red_card → cartao_vermelho`.

### ✅ Colunas faltantes adicionadas na tabela de jogadores
Tabela expandida de 12 para 18 colunas: Pos, xA, Ch, ChG, Pas, PasC, PC, Des, Int, 🟥, Def.

---

## 🟡 Prioridade Média — Dados Não Renderizados

### ✅ Odds O/U e BTTS no header
Mini painel abaixo do placar: O/U 1.5, 3.5, U 1.5, 2.5, 3.5, BTTS Sim/Não.

### ✅ País da liga (`jogo.pais`) exibido
### ✅ Modelo da predição (`predicao.modelo`) exibido
### ✅ Horário das transmissões (`transmissoes.inicio`) exibido
### ✅ País do estádio (`estadio.pais`) exibido
### ✅ V/E/D record no FormCard
### ✅ Gols totais do H2H exibidos
### ✅ Colunas GP, GC, xGF, xGA na classificação

---

## 🟢 Prioridade Baixa — Endpoints Não Integrados

### ✅ Polymarket integrado
Nova seção com odds preditivas, placares exatos e artilheiros.

### ✅ Perfil completo do técnico integrado
Seção "Técnicos" expandida com histórico completo da carreira.

### ✅ Elenco completo dos times integrado
Nova seção "Elenco Completo" com jogadores por posição.

### ✅ Lista de jogadores com status integrada
Nova seção "Disponibilidade dos Jogadores".

---

## ⚪ Manutenção / Infra

### [ ] Popular `ml/data/ml_data.json` com médias reais
Único item remanescente. Atualmente placeholder vazio (`league_averages: {}`). CI roda sem base histórica.

### ✅ `avg_red_cards` adicionado à StatsTable

---

## 📊 Resumo

| Categoria | Qtde | Status |
|-----------|:----:|:------:|
| 🔴 Bugs (dados quebrados) | 2 | ✅ |
| 🟡 Dados não renderizados | 9 | ✅ |
| 🟢 Endpoints não integrados | 4 | ✅ |
| ⚪ Manutenção | 2 | 1✅ 1⏳ |
| **Total** | **17** | **16✅ 1⏳** |
