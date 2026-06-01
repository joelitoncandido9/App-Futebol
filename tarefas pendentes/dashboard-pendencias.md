# Pendências — Dashboard (alimenta os analistas)

> O dashboard é a fonte única de dados para os agentes. Se os dados estiverem incompletos ou errados, a análise será ruim.
> Lista gerada em 31/05/2026.

---

## ✅ Já Resolvidos (17 itens)

### 🔴 Key mismatches corrigidos (route.ts)
Mapeamento alterado de inglês para português: `goal_assist → assistencias`, `expected_goals → xg`, `yellow_card → cartao_amarelo`, `red_card → cartao_vermelho`, etc.

### 🔴 Tabela de jogadores expandida (12 → 18 colunas)
Adicionadas: Pos, xA, Ch, ChG, Pas, PasC, PC, Des, Int, 🟥, Def — com abreviação de posição (GOL, ZAG, LAT, VOL, MEI, ATA, PON, SUB).

### 🟡 Odds O/U e BTTS adicionados ao header
### 🟡 `jogo.pais` — exibido ao lado do nome da liga
### 🟡 `predicao.modelo` — exibido na barra de predição
### 🟡 `transmissoes.inicio` — exibido no card de transmissão
### 🟡 `estadio.pais` — exibido ao lado da cidade
### 🟡 W/D/L record — exibido no FormCard de cada time
### 🟡 Gols totais do H2H — exibidos no confronto direto
### 🟡 Colunas GP, GC, xGF, xGA adicionadas à classificação
### ⚪ avg_red_cards adicionado à StatsTable

### ✅ MatchAnalytics sem abas
Todas as seções (Estatísticas, Shotmap, xG Timeline, Pressão) renderizadas simultaneamente.

### ✅ Textos traduzidos para português
`Rating → Nota geral`, `ML → Placar`, `Conf → Confiança`.

### ✅ Polymarket integrado ao dashboard
Nova seção com odds preditivas, placares exatos e artilheiros mais prováveis.

### ✅ Elenco completo integrado (v2 /teams/{id}/squad/)
Nova seção "Elenco Completo" com jogadores agrupados por posição.

### ✅ Perfil técnico completo integrado (v1 /managers/)
Seção "Técnicos" expandida com histórico da carreira (jogos, vitórias, xG, clean sheets).

### ✅ Lista de jogadores com status integrada (v1 /players/)
Nova seção "Disponibilidade dos Jogadores" com lesões, suspensões e dúvidas.

### ✅ DataRow + indicador `—` para dados faltantes
Criado componente `DataRow` reutilizável que sempre exibe a label, mostrando `—` quando o valor é nulo. Aplicado em CoachCard, ContextoSection, RefereeSection.

### ✅ Seção "Dados Brutos (JSON)" colapsável
Adicionado `<details>` ao final do dashboard com JSON completo da API e botão "Copiar JSON".

### ✅ Nomenclatura normalizada para PT-BR
- `pressing_intensity` → `intensidade_pressao`, `defensive_line` → `linha_defensiva`, `top_styles` → `estilos_principais`
- `expected_goals` → `gols_esperados` (com `casa`/`fora`)

---

## ⚪ Dashboard fully complete ✅

---

## 📊 Resumo

| Categoria | Qtde |
|-----------|:----:|
| 🔴 Dados quebrados (key mismatches) | 1 (4 campos) |
| 🔴 Colunas faltantes na tabela jogadores | 10 |
| 🟡 Dados existentes não exibidos | 8 |
| 🟢 Endpoints não integrados | 4 |
| ⚪ Organização | 3 |
| **Total** | **26** |
