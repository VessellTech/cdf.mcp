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
    description: "Projeção de fluxo de caixa (entradas/saídas/saldo) para os próximos meses.",
    method: "GET",
    path: "/api/cashflow/forecast",
    input: {},
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
    description: "Projeção de gastos por categoria com base no histórico.",
    method: "GET",
    path: "/api/analytics/spending-projection",
    input: {},
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
    description: "Projeção de evolução do patrimônio líquido (ativos - dívidas).",
    method: "GET",
    path: "/api/analytics/networth-projection",
    input: {},
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
    description: "Resumo dos gastos do mês corrente por categoria.",
    method: "GET",
    path: "/api/analytics/current-month-spending",
    input: {},
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
    description: "Gasto acumulado por categoria (com subcategorias) e comparação com orçamento.",
    method: "GET",
    path: "/api/categories/insights",
    input: {},
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
    description: "Highlight textual gerado a partir da movimentação financeira do mês.",
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
      "Observações financeiras já analisadas e prontas para narrar (cada item já vem com um texto pronto em `text`): padrão de dia da semana por categoria, aumento de gasto nos dias após o recebimento de renda, e categorias que sobem nos fins de semana.",
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
    description: "Lista as tags usadas para marcar transações.",
    method: "GET",
    path: "/api/tags",
    input: {},
    outputSchema: z.object({ data: z.array(tagSchema) }),
    readOnly: true,
  },
  {
    name: "tags_insights",
    title: "Insights por tag",
    description: "Agregação mensal de gastos por tag.",
    method: "GET",
    path: "/api/tags/insights",
    input: {},
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
      "Saldo total, receita/despesa média mensal, taxa de poupança, reserva de emergência (meses), endividamento sobre a renda anual e patrimônio.",
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
      "Progresso, prazo, meses restantes e aporte mensal necessário para cada meta financeira do usuário.",
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
      "Parcelas de compras parceladas (não faturas de cartão — qualquer forma de pagamento com totalInstallments > 1) ainda não pagas. `count`/`total` somam TODAS as parcelas em aberto, sem filtro de data — inclui parcelas já vencidas. `upcoming` traz até 5 parcelas com a data mais próxima, ordenadas de forma crescente; se houver parcela vencida e não paga, ela aparece primeiro (não é só futuro). Use esta ferramenta pra saber o compromisso do usuário com compras parceladas em geral; para o total da fatura mensal de um cartão específico use current_invoice/next_invoice, e para faturas de cartão pendentes em geral use list_pending_invoices.",
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
      "Contas recorrentes (aluguel, luz, etc.) cujo valor deste mês veio bem acima da média histórica dos últimos 6 meses.",
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
      "Recorrências de despesa ativas (assinaturas, mensalidades), total mensal comprometido e possíveis duplicidades por categoria (ex.: dois streamings). Não indica uso do serviço — o app não tem esse dado, só o financeiro.",
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
      "Detecta quando a sequência atual de dias seguidos com gasto de transporte (Uber, combustível) está bem acima do normal do usuário.",
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
      "Janela de 5 dias, dentro dos próximos 30, com maior concentração de compromissos (transações não pagas + faturas de cartão a vencer).",
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
      "Avisa quando hoje é véspera do fechamento da fatura de algum cartão — esperar até amanhã para comprar rende mais dias para pagar.",
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
      "Simula uma compra única (a partir de hoje): verifica se o saldo atual cobre, o impacto no saldo projetado de 12 meses (inclusive se cria mês no vermelho) e quanto atrasa cada meta ativa do usuário. Não grava nada, é só simulação.",
    method: "GET",
    path: "/api/insights/can-afford",
    input: {
      amount: z.number().describe("Valor da compra em reais"),
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
      "Série histórica contínua (meses com e sem movimento) com saldo reconstruído, patrimônio e estatística elaborada (média/mediana/desvio/variação, tendência por regressão linear, médias móveis 3/6/12m, taxa de poupança). Suporta vida inteira (até 120 meses). Use from/to como YYYY-MM ou YYYY-MM-DD.",
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
      "Separa crescimento de patrimônio por aporte/resgate (Transaction.equityId) e valorização (EquityValuation.value - cost). Retorna série mensal e resumo com total de aportes, stats e tendência da valorização.",
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
      "Top N categorias por volume no período com série mensal por categoria e estatística (média/mediana/desvio + tendência). Útil para sazonalidade e vida inteira.",
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
    description: "Cria uma nova tag.",
    method: "POST",
    path: "/api/tags",
    input: { name: z.string(), color: z.string().optional() },
    outputSchema: tagSchema,
  },
];
