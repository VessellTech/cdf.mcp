import { z } from "zod";
import type { ToolDef } from "../types.js";

const tagSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  color: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const cashflowCategorySchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  paid: z.number().optional(),
  pending: z.number().optional(),
  total: z.number().optional(),
  effectiveTotal: z.number().optional(),
  projected: z.number().optional(),
});

export const insightTools: ToolDef[] = [
  {
    name: "cashflow_forecast",
    title: "Projeção de fluxo de caixa",
    description:
      "Projeção mês a mês (até 12 meses) de entradas, saídas e saldo projetado, incluindo receita/despesa recorrente, categorias, centros de custo e meses no vermelho. Quando pending=true (default) e não há simulação, serve a leitura já materializada (cache); caso contrário recalcula ao vivo no motor Python. Suporta simular liquidação de um ativo (liquidationParams) ou amortização extra de uma dívida (simulationParams) e ver o impacto no saldo projetado — não grava nada, é só simulação. Diferença dos outros: é o único que traz saldo/caixa completo por mês; para só gastos por categoria use spending_projection, para só patrimônio líquido use networth_projection, para o mês corrente (sem projeção futura) use current_month_spending, e para série histórica real (passado) use analytics_history.",
    method: "GET",
    path: "/api/cashflow/forecast",
    input: {
      userId: z.string().optional().describe("Id do cliente a consultar (uso de planejador financeiro); omitido usa o próprio usuário autenticado"),
      months: z.number().optional().describe("Quantidade de meses a projetar, 1-12 (default 12)"),
      includePending: z.boolean().optional().describe("Se true (default), considera transações pendentes na projeção; false usa só o histórico realizado e força recálculo ao vivo (não usa cache)"),
      topCategories: z.number().optional().describe("Quantas categorias de topo trazer por mês em topExpenses, 1-20 (default 5)"),
      liquidationParams: z
        .string()
        .optional()
        .describe(
          'JSON stringificado simulando a liquidação de um ativo: {"assetId": "<id do Equity>", "amount": number, "liquidationLevel"?: "LL1"|..., "months"?: number}. Só tem efeito se assetId e amount forem válidos.',
        ),
      simulationParams: z
        .string()
        .optional()
        .describe(
          'JSON stringificado simulando amortização extra de uma dívida: {"debtId": "<id>", "amount": number, "frequency"?: "MONTHLY"|..., "installments"?: number}. Só tem efeito se debtId e amount forem válidos.',
        ),
    },
    outputSchema: z.object({
      generatedAt: z.string().optional(),
      startingBalance: z.number().optional(),
      cacheHit: z.boolean().optional(),
      months: z
        .array(
          z.object({
            month: z.number().optional(),
            year: z.number().optional(),
            label: z.string().optional(),
            income: z
              .object({ paid: z.number().optional(), pending: z.number().optional(), total: z.number().optional() })
              .optional(),
            expense: z
              .object({ paid: z.number().optional(), pending: z.number().optional(), total: z.number().optional() })
              .optional(),
            projectedRecurringIncome: z.number().optional(),
            projectedRecurringExpense: z.number().optional(),
            effectiveIncome: z.number().optional(),
            effectiveExpense: z.number().optional(),
            effectiveNet: z.number().optional(),
            startingBalance: z.number().optional(),
            endingBalance: z.number().optional(),
            filledByAverage: z.boolean().optional(),
            hasRealData: z.boolean().optional(),
            budgetedIncome: z.number().optional(),
            budgetedExpense: z.number().optional(),
            totalAssets: z.number().optional(),
            categories: z.array(cashflowCategorySchema).optional(),
            topExpenses: z.array(cashflowCategorySchema).optional(),
            costCenters: z.array(z.object({ name: z.string().optional(), total: z.number().optional() })).optional(),
          }),
        )
        .optional(),
      currentMonthForecast: z.unknown().optional().nullable(),
      chartData: z.array(z.unknown()).optional(),
      balanceTrend: z.number().optional(),
      finalProjectedBalance: z.number().optional(),
      negativeMonths: z.array(z.object({ label: z.string().optional() })).optional(),
      variableSummary: z
        .array(
          z.object({
            description: z.string().optional(),
            amount: z.number().optional(),
            count: z.number().optional(),
            type: z.string().optional(),
            avg: z.number().optional(),
          }),
        )
        .optional(),
      categoryKeys: z.array(z.string()).optional(),
      costCenterKeys: z.array(z.string()).optional(),
    }),
    readOnly: true,
  },
  {
    name: "spending_projection",
    title: "Projeção de gastos",
    description:
      "Projeção mensal (até 12 meses) da despesa efetiva total e das categorias de maior peso, sem detalhar receita/saldo/patrimônio. É um recorte de cashflow_forecast focado só em despesa — use cashflow_forecast quando precisar também de saldo/entradas, e use este quando o interesse é só 'quanto vou gastar e em quê'.",
    method: "GET",
    path: "/api/analytics/spending-projection",
    input: {
      userId: z.string().optional().describe("Id do cliente a consultar (uso de planejador financeiro); omitido usa o próprio usuário autenticado"),
      months: z.number().optional().describe("Quantidade de meses a projetar, 1-12 (default 12)"),
      includePending: z.boolean().optional().describe("Se true (default), considera transações pendentes; false usa só o realizado e força recálculo ao vivo"),
      topCategories: z.number().optional().describe("Quantas categorias trazer por mês em topCategories, 1-20 (default 5)"),
    },
    outputSchema: z.object({
      generatedAt: z.string().optional(),
      months: z
        .array(
          z.object({
            month: z.number().optional(),
            year: z.number().optional(),
            label: z.string().optional(),
            projectedExpense: z.number().optional(),
            topCategories: z
              .array(
                z.object({
                  categoryId: z.string().optional().nullable(),
                  name: z.string().optional(),
                  type: z.string().optional(),
                  paid: z.number().optional(),
                  pending: z.number().optional(),
                  total: z.number().optional(),
                  effectiveTotal: z.number().optional(),
                  projected: z.number().optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
    }),
    readOnly: true,
  },
  {
    name: "networth_projection",
    title: "Projeção de patrimônio líquido",
    description:
      "Projeção mensal (até 12 meses) do patrimônio líquido (caixa projetado + total de equities), sem detalhar categorias de gasto/receita. Recorte de cashflow_forecast focado só em patrimônio — use este quando o interesse é só a curva de patrimônio, e wealth_evolution quando precisar separar quanto do crescimento veio de aporte vs valorização dos ativos (esse é histórico, não projeção).",
    method: "GET",
    path: "/api/analytics/networth-projection",
    input: {
      userId: z.string().optional().describe("Id do cliente a consultar (uso de planejador financeiro); omitido usa o próprio usuário autenticado"),
      months: z.number().optional().describe("Quantidade de meses a projetar, 1-12 (default 12)"),
      includePending: z.boolean().optional().describe("Se true (default), considera transações pendentes; false usa só o realizado e força recálculo ao vivo"),
    },
    outputSchema: z.object({
      generatedAt: z.string().optional(),
      startingNetWorth: z.number().optional(),
      months: z
        .array(
          z.object({
            month: z.number().optional(),
            year: z.number().optional(),
            label: z.string().optional(),
            netWorth: z.number().optional(),
            cashBalance: z.number().optional(),
            equityTotal: z.number().optional(),
          }),
        )
        .optional(),
    }),
    readOnly: true,
  },
  {
    name: "current_month_spending",
    title: "Gastos do mês atual",
    description:
      "Só o mês corrente (não série futura): gasto já realizado, ritmo diário, total projetado até o fim do mês e confiança da projeção, comparado a orçamento se houver. Diferente de cashflow_forecast/spending_projection (que olham vários meses à frente) e de categories_insights (que compara mês atual vs anterior por categoria, sem ritmo/projeção de fechamento).",
    method: "GET",
    path: "/api/analytics/current-month-spending",
    input: {
      userId: z.string().optional().describe("Id do cliente a consultar (uso de planejador financeiro); omitido usa o próprio usuário autenticado"),
      topCategories: z.number().optional().describe("Quantas categorias trazer em topCategories, 1-20 (default 5)"),
    },
    outputSchema: z.object({
      generatedAt: z.string().optional(),
      daysElapsed: z.number().optional(),
      daysInMonth: z.number().optional(),
      spentSoFar: z.number().optional(),
      projectedTotal: z.number().optional(),
      confidence: z.number().optional(),
      dailyPace: z.number().optional(),
      budget: z.number().optional().nullable(),
      overBudget: z.boolean().optional().nullable(),
      topCategories: z
        .array(
          z.object({
            categoryId: z.string().optional().nullable(),
            name: z.string().optional(),
            spentSoFar: z.number().optional(),
            projectedTotal: z.number().optional(),
          }),
        )
        .optional(),
      dailyBudgetSimple: z.number().optional().nullable(),
      dailyBudgetByWeekday: z.unknown().optional().nullable(),
    }),
    readOnly: true,
  },
  {
    name: "categories_insights",
    title: "Insights por categoria",
    description:
      "Gasto acumulado por categoria (somando subcategorias) no mês alvo vs mês anterior, com % de variação e comparação com orçamento (se houver Budget mensal para a categoria). Sem month/year usa o mês atual e serve a versão materializada (mais rápida); com month/year calcula ao vivo. Para série de vários meses use category_history; para insights por tag (não categoria) use tags_insights; para um resumo de correlações do momento (poupança, dívida, reserva) use financial_snapshot.",
    method: "GET",
    path: "/api/categories/insights",
    input: {
      userId: z.string().optional().describe("Id do cliente a consultar (uso de planejador financeiro); omitido usa o próprio usuário autenticado"),
      month: z.number().optional().describe("Mês alvo, 1-12 (default mês atual). Informar sem year usa o ano atual"),
      year: z.number().optional().describe("Ano alvo (default ano atual)"),
    },
    outputSchema: z.object({
      month: z.number().optional(),
      year: z.number().optional(),
      insights: z
        .array(
          z.object({
            categoryId: z.string().optional(),
            name: z.string().optional(),
            type: z.string().optional(),
            color: z.string().optional().nullable(),
            icon: z.string().optional().nullable(),
            parentId: z.string().optional().nullable(),
            currentMonth: z
              .object({
                total: z.number().optional(),
                transactions: z.number().optional(),
                lastTransactionDate: z.string().optional().nullable(),
              })
              .optional(),
            previousMonth: z.object({ total: z.number().optional() }).optional(),
            variationPercentage: z.number().optional().nullable(),
            budget: z
              .object({
                id: z.string().optional(),
                amount: z.number().optional(),
                spent: z.number().optional(),
                remaining: z.number().optional(),
                percentage: z.number().optional(),
              })
              .optional()
              .nullable(),
          }),
        )
        .optional(),
    }),
    readOnly: true,
  },
  {
    name: "insights_highlight",
    title: "Destaque financeiro do mês",
    description:
      "Devolve NO MÁXIMO um destaque textual (highlight pode vir null), escolhido por prioridade fixa: (1) contas atrasadas não pagas, senão (2) orçamento mensal mais estourado (>100% do limite), senão (3) categoria com maior alta de gasto vs mês anterior (gasto atual ≥ R$50 e variação > 15%). Pensado pra UI de 'destaque do dia', não para análise completa — para todos os alertas de comportamento use behavior_insights, e para anomalias específicas (contas, assinaturas, transporte, concentração de vencimentos, cartão) use as tools bill_anomalies/subscriptions_overview/transport_routine/bill_concentration/best_card_day.",
    method: "GET",
    path: "/api/insights/highlight",
    input: {},
    outputSchema: z.object({
      generatedAt: z.string().optional(),
      highlight: z
        .object({
          text: z.string().optional(),
          prompt: z.string().optional(),
          kind: z.enum(["overdue", "budget", "variation"]).optional(),
          categoryId: z.string().optional(),
        })
        .optional()
        .nullable(),
    }),
    readOnly: true,
  },
  {
    name: "behavior_insights",
    title: "Insights de comportamento",
    description:
      "Observações financeiras já analisadas e prontas para narrar (cada item já vem com um texto pronto em `text`): padrão de dia da semana por categoria, aumento de gasto nos dias após o recebimento de renda, e categorias que sobem nos fins de semana. Pode retornar lista vazia se nenhum padrão for detectado. Distinto de insights_highlight (só 1 destaque, prioriza atraso/orçamento) e das tools de anomalia específica (bill_anomalies, transport_routine, bill_concentration, best_card_day, subscriptions_overview), que olham sinais isolados diferentes.",
    method: "GET",
    path: "/api/insights/behavior",
    input: {},
    outputSchema: z.object({
      data: z.array(
        z.object({
          id: z.string().optional(),
          type: z
            .enum(["category_day_pattern", "post_payday_spike", "weekend_category_increase"])
            .optional(),
          category: z.string().optional(),
          dayGroup: z.enum(["weekday", "weekend"]).optional(),
          payday: z.number().optional(),
          pct: z.number().optional(),
          count: z.number().optional(),
          text: z.string().optional(),
        }),
      ),
    }),
    readOnly: true,
  },
  {
    name: "list_tags",
    title: "Listar tags",
    description: "Lista as tags usadas para marcar transações do usuário.",
    method: "GET",
    path: "/api/tags",
    input: {
      userId: z.string().optional().describe("Id do cliente a consultar (uso de planejador financeiro); omitido usa o próprio usuário autenticado"),
    },
    outputSchema: z.object({ data: z.array(tagSchema) }),
    readOnly: true,
  },
  {
    name: "tags_insights",
    title: "Insights por tag",
    description:
      "Total gasto, contagem de transações e data da última movimentação, agregados por tag no mês alvo. Sem month/year usa o mês atual e serve a versão materializada; com month/year calcula ao vivo. Equivalente a categories_insights mas por tag em vez de categoria — não traz comparação com mês anterior nem orçamento (tags não têm budget).",
    method: "GET",
    path: "/api/tags/insights",
    input: {
      month: z.number().optional().describe("Mês alvo, 1-12 (default mês atual)"),
      year: z.number().optional().describe("Ano alvo (default ano atual)"),
    },
    outputSchema: z.object({
      month: z.number().optional(),
      year: z.number().optional(),
      insights: z
        .array(
          z.object({
            tagId: z.string().optional(),
            name: z.string().optional(),
            color: z.string().optional().nullable(),
            total: z.number().optional(),
            transactions: z.number().optional(),
            lastTransactionDate: z.string().optional().nullable(),
          }),
        )
        .optional(),
    }),
    readOnly: true,
  },
  {
    name: "financial_snapshot",
    title: "Resumo financeiro correlacionado",
    description:
      "Retrato único do momento atual (não série): saldo total, receita/despesa média mensal, taxa de poupança, reserva de emergência (meses), endividamento sobre a renda anual e patrimônio. Vem de uma tabela materializada (FinancialSnapshot) recalculada de forma best-effort a cada escrita relevante; se ainda não existir para o usuário, é calculada na hora. Diferença de analytics_history: aqui é 1 número por métrica (o estado agora), lá é série mensal com estatística/tendência.",
    method: "GET",
    path: "/api/insights/financial-snapshot",
    input: {},
    outputSchema: z.object({
      totalBalance: z.number().optional(),
      avgMonthlyIncome: z.number().optional(),
      avgMonthlyExpense: z.number().optional(),
      savingsRatePct: z.number().optional().nullable(),
      emergencyReserveMonths: z.number().optional().nullable(),
      debtToIncomeRatioPct: z.number().optional().nullable(),
      totalDebt: z.number().optional(),
      totalEquityValue: z.number().optional(),
      totalEquityCost: z.number().optional(),
      lastCalculatedAt: z.string().optional(),
    }),
    readOnly: true,
  },
  {
    name: "goal_projections",
    title: "Projeção de metas",
    description:
      "Progresso, prazo, meses restantes e aporte mensal necessário para cada meta financeira ativa do usuário. Usado também por can_afford para calcular quanto uma compra atrasaria cada meta — se só precisa desse impacto, prefira can_afford diretamente.",
    method: "GET",
    path: "/api/insights/goal-projections",
    input: {},
    outputSchema: z.object({
      metas: z.array(
        z.object({
          nome: z.string().optional(),
          atual: z.number().optional(),
          alvo: z.number().optional(),
          progressoPct: z.number().optional(),
          prazo: z.string().optional().nullable(),
          mesesRestantes: z.number().optional().nullable(),
          aporteMensalNecessario: z.number().optional().nullable(),
        }),
      ),
    }),
    readOnly: true,
  },
  {
    name: "active_installments",
    title: "Parcelas ativas",
    description:
      "Parcelas de compras parceladas (não faturas de cartão — qualquer forma de pagamento com totalInstallments > 1) ainda não pagas. `count`/`total` somam TODAS as parcelas em aberto, sem filtro de data — inclui parcelas já vencidas. `upcoming` traz até 5 parcelas com a data mais próxima, ordenadas de forma crescente; se houver parcela vencida e não paga, ela aparece primeiro (não é só futuro). Use esta ferramenta pra saber o compromisso do usuário com compras parceladas em geral; para o total da fatura mensal de um cartão específico use invoice_for_period, e para faturas de cartão pendentes em geral use list_pending_invoices.",
    method: "GET",
    path: "/api/insights/active-installments",
    input: {},
    outputSchema: z.object({
      count: z.number().optional(),
      total: z.number().optional(),
      upcoming: z.array(
        z.object({
          description: z.string().optional(),
          amount: z.number().optional(),
          currentInstallment: z.number().optional(),
          totalInstallments: z.number().optional(),
          date: z.string().optional(),
        }),
      ),
      text: z.string().optional(),
    }),
    readOnly: true,
  },
  {
    name: "bill_anomalies",
    title: "Contas acima da média",
    description:
      "Contas recorrentes de despesa ativas (aluguel, luz, etc.) cuja última ocorrência lançada neste mês veio bem acima (>20%) da média das ocorrências dos últimos 6 meses. Exige pelo menos 2 ocorrências históricas para comparar — recorrente nova ou sem histórico suficiente não entra. Lista vazia se nada passar do limiar; ordenado do maior desvio % para o menor.",
    method: "GET",
    path: "/api/insights/bill-anomalies",
    input: {},
    outputSchema: z.object({
      data: z.array(
        z.object({
          id: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional().nullable(),
          currentAmount: z.number().optional(),
          avgAmount: z.number().optional(),
          pct: z.number().optional(),
          text: z.string().optional(),
        }),
      ),
    }),
    readOnly: true,
  },
  {
    name: "subscriptions_overview",
    title: "Assinaturas e recorrências",
    description:
      "Todas as recorrências de despesa ativas (RecurringTransaction), com o valor normalizado para mensal (DAILY/WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY/YEARLY convertidos), total mensal comprometido, e duplicidades: categorias com 2+ recorrências ativas (ex.: dois streamings). Não indica uso do serviço nem se a assinatura está 'esquecida' — o app só tem o dado financeiro, não de uso.",
    method: "GET",
    path: "/api/insights/subscriptions",
    input: {},
    outputSchema: z.object({
      subscriptions: z.array(
        z.object({
          description: z.string().optional(),
          category: z.string().optional().nullable(),
          amount: z.number().optional(),
          frequency: z.string().optional(),
          monthlyAmount: z.number().optional(),
        }),
      ),
      totalMonthly: z.number().optional(),
      duplicates: z.array(
        z.object({
          category: z.string().optional(),
          descriptions: z.array(z.string()).optional(),
          text: z.string().optional(),
        }),
      ),
      text: z.string().optional(),
    }),
    readOnly: true,
  },
  {
    name: "transport_routine",
    title: "Rotina de transporte",
    description:
      "Detecta quando a sequência atual de dias seguidos com gasto de transporte (categoria TRANSPORT ou nome contendo 'transport') está bem acima do normal do usuário: olha os últimos 90 dias, só sinaliza se o último gasto foi hoje/ontem, a sequência atual tem ≥3 dias e é ≥1.5x a média das sequências anteriores. Retorna lista vazia (não erro) se não houver sinal ou histórico insuficiente (<3 dias de gasto no período).",
    method: "GET",
    path: "/api/insights/transport-routine",
    input: {},
    outputSchema: z.object({
      data: z.array(
        z.object({
          id: z.string().optional(),
          currentStreak: z.number().optional(),
          avgStreak: z.number().optional(),
          text: z.string().optional(),
        }),
      ),
    }),
    readOnly: true,
  },
  {
    name: "bill_concentration",
    title: "Dias de maior aperto",
    description:
      "Acha a janela de 5 dias consecutivos, dentro dos próximos 30, com maior concentração de compromissos (transações EXPENSE/INVOICE_PAYMENT não pagas + faturas de cartão não pagas vencendo no período). Só retorna algo se essa janela concentrar ≥35% do total previsto para os 30 dias — senão vem lista vazia.",
    method: "GET",
    path: "/api/insights/bill-concentration",
    input: {},
    outputSchema: z.object({
      data: z.array(
        z.object({
          id: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          amount: z.number().optional(),
          sharePct: z.number().optional(),
          text: z.string().optional(),
        }),
      ),
    }),
    readOnly: true,
  },
  {
    name: "best_card_day",
    title: "Melhor dia para comprar no cartão",
    description:
      "Avisa, para cada cartão do usuário, quando hoje é véspera do fechamento da fatura — comprar amanhã em vez de hoje cairia na fatura seguinte, ganhando mais dias até o vencimento para pagar. Só sinaliza cartões onde essa diferença é ≥15 dias; cartões sem closingDay/dueDay configurado são ignorados. Lista vazia se nenhum cartão estiver na véspera do fechamento.",
    method: "GET",
    path: "/api/insights/best-card-day",
    input: {},
    outputSchema: z.object({
      data: z.array(
        z.object({
          id: z.string().optional(),
          cardName: z.string().optional(),
          extraDays: z.number().optional(),
          text: z.string().optional(),
        }),
      ),
    }),
    readOnly: true,
  },
  {
    name: "can_afford",
    title: "Posso comprar isso?",
    description:
      "Simula uma despesa única a partir de hoje: verifica se o saldo atual (soma de contas não-cartão) cobre, o impacto no saldo projetado dos próximos 12 meses (reusando a mesma projeção materializada de cashflow_forecast, inclusive se algum mês passa a ficar negativo) e quanto meses cada meta ativa atrasaria dado o aporte mensal necessário dela. Não grava nada, é só simulação — para comparar cenários de liquidação de ativo ou amortização de dívida use cashflow_forecast com liquidationParams/simulationParams.",
    method: "GET",
    path: "/api/insights/can-afford",
    input: {
      amount: z.number().describe("Valor da compra simulada, em reais. Deve ser > 0"),
    },
    outputSchema: z.object({
      amount: z.number().optional(),
      currentBalance: z.number().optional(),
      canAffordNow: z.boolean().optional(),
      months: z.array(
        z.object({
          label: z.string().optional(),
          originalEndingBalance: z.number().optional(),
          newEndingBalance: z.number().optional(),
        }),
      ).optional().nullable(),
      newNegativeMonths: z.array(z.string()).optional(),
      goalImpacts: z.array(
        z.object({
          goal: z.string().optional(),
          delayMonths: z.number().optional(),
        }),
      ).optional().nullable(),
      text: z.string().optional(),
    }),
    readOnly: true,
  },
  {
    name: "analytics_history",
    title: "Histórico financeiro mensal",
    description:
      "Série histórica contínua (meses com e sem movimento) com saldo reconstruído, patrimônio e estatística elaborada (média/mediana/desvio/variação, tendência por regressão linear, médias móveis 3/6/12m, taxa de poupança). Suporta vida inteira (até 120 meses). Use from/to como YYYY-MM ou YYYY-MM-DD. Use esta ferramenta pro histórico mensal geral (saldo/patrimônio/receita/despesa); para série por categoria use category_history, para separar aporte de valorização em investimentos use wealth_evolution, e para um retrato único do momento atual (não série) use financial_snapshot.",
    method: "GET",
    path: "/api/analytics/history",
    input: {
      from: z.string().optional().describe("Início do intervalo (YYYY-MM ou YYYY-MM-DD) — default 11 meses atrás"),
      to: z.string().optional().describe("Fim do intervalo (YYYY-MM ou YYYY-MM-DD) — default mês atual"),
    },
    outputSchema: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      currentBalance: z.number().optional(),
      equityTotal: z.number().optional(),
      debtTotal: z.number().optional(),
      months: z
        .array(
          z.object({
            year: z.number().optional(),
            month: z.number().optional(),
            label: z.string().optional(),
            ym: z.string().optional(),
            income: z.number().optional(),
            expense: z.number().optional(),
            net: z.number().optional(),
            endingBalance: z.number().optional(),
            equityTotal: z.number().optional(),
            totalAssets: z.number().optional(),
            netWorth: z.number().optional(),
            debtTotal: z.number().optional(),
            budgetedExpense: z.number().optional(),
            count: z.number().optional(),
          }),
        )
        .optional(),
      stats: z
        .object({
          income: z.object({ count: z.number().optional(), mean: z.number().optional(), median: z.number().optional(), stddev: z.number().optional(), min: z.number().optional(), max: z.number().optional(), p90: z.number().optional(), cv: z.number().optional() }).optional(),
          expense: z.object({ count: z.number().optional(), mean: z.number().optional(), median: z.number().optional(), stddev: z.number().optional(), min: z.number().optional(), max: z.number().optional(), p90: z.number().optional(), cv: z.number().optional() }).optional(),
          net: z.object({ count: z.number().optional(), mean: z.number().optional(), median: z.number().optional(), stddev: z.number().optional(), min: z.number().optional(), max: z.number().optional(), p90: z.number().optional(), cv: z.number().optional() }).optional(),
          savingsRate: z.object({ count: z.number().optional(), mean: z.number().optional(), median: z.number().optional(), stddev: z.number().optional(), min: z.number().optional(), max: z.number().optional(), p90: z.number().optional(), cv: z.number().optional() }).optional(),
        })
        .optional(),
      trend: z
        .object({
          income: z.object({ slope: z.number().optional(), intercept: z.number().optional(), r2: z.number().optional(), direction: z.string().optional() }).optional(),
          expense: z.object({ slope: z.number().optional(), intercept: z.number().optional(), r2: z.number().optional(), direction: z.string().optional() }).optional(),
          net: z.object({ slope: z.number().optional(), intercept: z.number().optional(), r2: z.number().optional(), direction: z.string().optional() }).optional(),
        })
        .optional(),
      movingAverage: z
        .object({
          net_3m: z.array(z.number()).optional(),
          net_6m: z.array(z.number()).optional(),
          net_12m: z.array(z.number()).optional(),
        })
        .optional(),
    }),
    readOnly: true,
  },
  {
    name: "wealth_evolution",
    title: "Evolução patrimonial (aporte vs valorização)",
    description:
      "Série histórica mensal (não projeção) que separa quanto do crescimento de patrimônio veio de aporte/resgate (transações ligadas a um Equity) vs valorização de mercado (EquityValuation.value - cost). Retorna série mensal e resumo com total de aportes, estatística e tendência da valorização. Diferença de networth_projection: aqui é passado/histórico e decompõe a causa do crescimento; lá é projeção futura sem decompor.",
    method: "GET",
    path: "/api/analytics/wealth-evolution",
    input: {
      from: z.string().optional().describe("Início (YYYY-MM ou YYYY-MM-DD)"),
      to: z.string().optional().describe("Fim (YYYY-MM ou YYYY-MM-DD)"),
    },
    outputSchema: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      months: z
        .array(
          z.object({
            ym: z.string().optional(),
            label: z.string().optional(),
            aporte: z.number().optional(),
            resgate: z.number().optional(),
            equityTotal: z.number().optional(),
            valorizacao: z.number().optional(),
          }),
        )
        .optional(),
      summary: z
        .object({
          totalAporte: z.number().optional(),
          totalResgate: z.number().optional(),
          netAporte: z.number().optional(),
          statsValorizacao: z.object({ count: z.number().optional(), mean: z.number().optional(), median: z.number().optional(), stddev: z.number().optional(), min: z.number().optional(), max: z.number().optional(), p90: z.number().optional(), cv: z.number().optional() }).optional(),
          trendValorizacao: z.object({ slope: z.number().optional(), intercept: z.number().optional(), r2: z.number().optional(), direction: z.string().optional() }).optional(),
        })
        .optional(),
    }),
    readOnly: true,
  },
  {
    name: "category_history",
    title: "Histórico por categoria",
    description:
      "Série histórica mensal (não projeção) por categoria, limitada às top N categorias por volume no período, com estatística (média/mediana/desvio) e tendência de cada uma. Use para sazonalidade/comparar categorias ao longo do tempo; para o total geral (sem quebra por categoria) use analytics_history, e para o mês corrente vs anterior por categoria (sem série longa) use categories_insights.",
    method: "GET",
    path: "/api/analytics/category-history",
    input: {
      from: z.string().optional().describe("Início (YYYY-MM ou YYYY-MM-DD)"),
      to: z.string().optional().describe("Fim (YYYY-MM ou YYYY-MM-DD)"),
      top: z.number().optional().describe("Top N categorias (1-20, default 5)"),
    },
    outputSchema: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      top: z.array(z.string()).optional(),
      series: z
        .array(
          z.object({
            name: z.string().optional(),
            points: z.array(z.object({ ym: z.string().optional(), value: z.number().optional() })).optional(),
            stats: z.object({ count: z.number().optional(), mean: z.number().optional(), median: z.number().optional(), stddev: z.number().optional(), min: z.number().optional(), max: z.number().optional(), p90: z.number().optional(), cv: z.number().optional() }).optional(),
            trend: z.object({ slope: z.number().optional(), intercept: z.number().optional(), r2: z.number().optional(), direction: z.string().optional() }).optional(),
          }),
        )
        .optional(),
    }),
    readOnly: true,
  },
  {
    name: "create_tag",
    title: "Criar tag",
    description: "Cria uma nova tag para marcar transações do usuário autenticado. Não valida duplicidade de nome.",
    method: "POST",
    path: "/api/tags",
    input: {
      name: z.string().describe("Nome da tag"),
      color: z.string().optional().describe("Cor da tag (ex: hex '#RRGGBB')"),
    },
    outputSchema: tagSchema,
  },
  {
    name: "update_tag",
    title: "Atualizar tag",
    description: "Atualiza nome e/ou cor de uma tag existente do usuário autenticado (`id` = id da tag). Campos omitidos mantêm o valor atual. `count` retorna 0 se o id não existir ou não pertencer ao usuário (sem erro).",
    method: "PUT",
    path: "/api/tags/:id",
    input: {
      id: z.string().describe("Id da tag a atualizar"),
      name: z.string().optional().describe("Novo nome"),
      color: z.string().optional().describe("Nova cor (ex: hex '#RRGGBB')"),
    },
    outputSchema: z.object({ count: z.number().optional() }),
  },
  {
    name: "delete_tag",
    title: "Excluir tag",
    description: "Exclui uma tag permanentemente (`id` = id da tag). Não afeta as transações que a usavam além de removê-la delas (relação N:N com cascade). `count` retorna 0 se o id não existir ou não pertencer ao usuário (sem erro).",
    method: "DELETE",
    path: "/api/tags/:id",
    input: { id: z.string().describe("Id da tag a excluir") },
    destructive: true,
    outputSchema: z.object({ count: z.number().optional() }),
  },
];
