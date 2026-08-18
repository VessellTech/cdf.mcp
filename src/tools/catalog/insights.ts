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
    description: "Análise de padrões de comportamento financeiro (gastos recorrentes, anomalias, etc).",
    method: "GET",
    path: "/api/insights/behavior",
    input: {},
    outputSchema: z.object({
      data: z.array(
        z.object({
          id: z.string().optional(),
          category: z.string().optional(),
          dayGroup: z.enum(["weekday", "weekend"]).optional(),
          timeGroup: z.enum(["dawn", "morning", "afternoon", "night"]).optional(),
          pct: z.number().optional(),
          count: z.number().optional(),
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
    name: "create_tag",
    title: "Criar tag",
    description: "Cria uma nova tag.",
    method: "POST",
    path: "/api/tags",
    input: { name: z.string(), color: z.string().optional() },
    outputSchema: tagSchema,
  },
];
