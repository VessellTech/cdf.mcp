import { z } from "zod";
import type { ToolDef } from "../types.js";

// --- Shapes de saída (espelham as queries de goals/budgets/debts.husk + schema Prisma) ---

const countShape = z.object({
  count: z.number().optional(),
});

const goalShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  targetAmount: z.number().optional(),
  currentAmount: z.number().optional(),
  deadline: z.string().optional().nullable(),
  category: z.string().optional(),
  color: z.string().optional(),
  currency: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const budgetShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "INVESTMENT"]).optional(),
  category: z.string().optional().nullable(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  period: z.enum(["MONTHLY", "YEARLY"]).optional(),
  year: z.number().optional(),
  month: z.number().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const budgetComparisonShape = z.object({
  budget: budgetShape.optional(),
  budgeted: z.number().optional(),
  spent: z.number().optional(),
  remaining: z.number().optional(),
  percentage: z.number().optional(),
  transactions: z.number().optional(),
  daily: z
    .array(
      z.object({
        date: z.string().optional(),
        label: z.string().optional(),
        spent: z.number().optional(),
        projected: z.number().optional().nullable(),
      }),
    )
    .optional(),
});

const debtShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  totalAmount: z.number().optional(),
  remainingAmount: z.number().optional(),
  interestRate: z.number().optional().nullable(),
  dueDate: z.string().optional(),
  creditor: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "PAID", "OVERDUE"]).optional(),
  currency: z.string().optional(),
  category: z.string().optional().nullable(),
  equityId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const goalBudgetDebtTools: ToolDef[] = [
  {
    name: "list_goals",
    title: "Listar metas",
    description: "Lista as metas financeiras do usuário.",
    method: "GET",
    path: "/api/goals",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(goalShape) }),
  },
  {
    name: "create_goal",
    title: "Criar meta",
    description: "Cria uma meta financeira.",
    method: "POST",
    path: "/api/goals",
    input: {
      name: z.string(),
      targetAmount: z.number(),
      currentAmount: z.number().optional(),
      targetDate: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
    },
    outputSchema: goalShape,
  },
  {
    name: "update_goal",
    title: "Atualizar meta",
    description: "Atualiza uma meta (parcial).",
    method: "PUT",
    path: "/api/goals/:id",
    input: { id: z.string(), name: z.string().optional(), targetAmount: z.number().optional(), currentAmount: z.number().optional(), targetDate: z.string().optional() },
    outputSchema: countShape,
  },
  { name: "delete_goal", title: "Excluir meta", description: "Exclui uma meta.", method: "DELETE", path: "/api/goals/:id", input: { id: z.string() }, destructive: true, outputSchema: countShape },

  {
    name: "list_budgets",
    title: "Listar orçamentos",
    description: "Lista orçamentos do usuário, opcionalmente filtrando por ano/mês.",
    method: "GET",
    path: "/api/budgets",
    input: { year: z.string().optional(), month: z.string().optional() },
    readOnly: true,
    outputSchema: z.object({ data: z.array(budgetShape) }),
  },
  {
    name: "create_budget",
    title: "Criar orçamento",
    description: "Cria um orçamento mensal por categoria.",
    method: "POST",
    path: "/api/budgets",
    input: { categoryId: z.string(), amount: z.number(), year: z.number().int(), month: z.number().int() },
    outputSchema: budgetShape,
  },
  {
    name: "update_budget",
    title: "Atualizar orçamento",
    description: "Atualiza um orçamento (parcial).",
    method: "PUT",
    path: "/api/budgets/:id",
    input: { id: z.string(), amount: z.number().optional() },
    outputSchema: countShape,
  },
  {
    name: "delete_budget",
    title: "Excluir orçamento",
    description: "Exclui um orçamento.",
    method: "DELETE",
    path: "/api/budgets/:id",
    input: { id: z.string() },
    destructive: true,
    outputSchema: z.object({ count: z.number().optional(), success: z.boolean().optional() }),
  },
  {
    name: "budget_comparison",
    title: "Comparativo do orçamento",
    description: "Compara orçado vs gasto real de um orçamento, com as transações da categoria no período.",
    method: "GET",
    path: "/api/budgets/:id/comparison",
    input: { id: z.string() },
    readOnly: true,
    outputSchema: budgetComparisonShape,
  },

  {
    name: "list_debts",
    title: "Listar dívidas",
    description: "Lista as dívidas do usuário.",
    method: "GET",
    path: "/api/debts",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(debtShape) }),
  },
  {
    name: "create_debt",
    title: "Criar dívida",
    description: "Registra uma dívida.",
    method: "POST",
    path: "/api/debts",
    input: {
      name: z.string(),
      totalAmount: z.number(),
      remainingAmount: z.number().optional(),
      interestRate: z.number().optional(),
      dueDate: z.string().optional(),
      creditor: z.string().optional(),
      equityId: z.string().optional(),
    },
    outputSchema: debtShape,
  },
  {
    name: "update_debt",
    title: "Atualizar dívida",
    description: "Atualiza uma dívida (parcial — campo vazio mantém o atual).",
    method: "PUT",
    path: "/api/debts/:id",
    input: { id: z.string(), remainingAmount: z.number().optional(), interestRate: z.number().optional(), dueDate: z.string().optional() },
    outputSchema: countShape,
  },
  {
    name: "delete_debt",
    title: "Excluir dívida",
    description: "Exclui uma dívida.",
    method: "DELETE",
    path: "/api/debts/:id",
    input: { id: z.string() },
    destructive: true,
    outputSchema: countShape,
  },
  {
    name: "debt_payoff_plan",
    title: "Plano de quitação de dívida",
    description:
      "Simula a quitação de UMA dívida: informe targetMonths (quanto pagar por mês pra quitar em N meses) OU monthlyPayment (em quantos meses quita pagando R$X/mês) — nunca os dois. Devolve o valor mensal, total pago, juros totais e o impacto no saldo projetado (inclusive se cria mês no vermelho). Não grava nada, é só simulação.",
    method: "GET",
    path: "/api/insights/debt-payoff-plan",
    input: {
      debtId: z.string().describe("id da dívida (ver list_debts)"),
      targetMonths: z.number().optional().describe("Quero quitar em N meses — devolve o valor mensal necessário"),
      monthlyPayment: z.number().optional().describe("Posso pagar R$X/mês — devolve em quantos meses quita"),
    },
    readOnly: true,
    outputSchema: z.object({
      debtId: z.string().optional(),
      debtName: z.string().optional(),
      remainingAmount: z.number().optional(),
      interestRatePct: z.number().optional(),
      monthlyPayment: z.number().optional(),
      months: z.number().optional(),
      totalPaid: z.number().optional(),
      totalInterest: z.number().optional(),
      projectedImpact: z
        .array(
          z.object({
            label: z.string().optional(),
            originalEndingBalance: z.number().optional(),
            newEndingBalance: z.number().optional(),
          }),
        )
        .optional(),
      newNegativeMonths: z.array(z.string()).optional(),
      text: z.string().optional(),
    }),
  },
];
