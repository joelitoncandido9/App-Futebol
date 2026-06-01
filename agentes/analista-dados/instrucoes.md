# Instruções — Analista de Dados

## Como usar

1. Acesse o dashboard de um jogo no site
2. Copie TODOS os dados exibidos (Ctrl+A, Ctrl+C)
3. Cole os dados para o Analista de Dados
4. Informe banca disponível e EV mínimo aceito

## Requisitos

- Dados completos do dashboard (copiar seção por seção)
- Banca informada pelo usuário
- EV mínimo aceito (padrão: 8%)

## O que o Analista de Dados cobre

- ✅ Validação de qualidade dos dados (score /10)
- ✅ Calibração de probabilidades vs Pinnacle (1X2, GOLS, ESCANTEIOS, BTTS, VERMELHOS)
- ✅ 25+ campos de médias por time
- ✅ Cálculo de EV para mercados com odd de mercado
- ✅ Odd justa do sistema para mercados sem odd de mercado
- ✅ Análise de desfalques e impacto
- ✅ Classificação do árbitro
- ✅ Relatório padronizado para o Analista Esportivo

## Diferenciais

- Não usa tools BSD — processa dados colados manualmente
- Foco exclusivamente quantitativo (zero opinião tática)
- Score de qualidade baseado em 5 critérios objetivos
- Separa mercados calibráveis (com Pinnacle) de não-calibráveis

## Arquivos

- `prompt.md` — Prompt completo do Analista de Dados
- `../../lib/system-prompt-analista-dados.ts` — Versão em TypeScript do prompt
