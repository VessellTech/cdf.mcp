import { z } from "zod";
import type { ToolDef } from "../types.js";

export const recurringTools: ToolDef[] = [
  {
    name: "list_recurring_transactions",
    title: "Listar transações recorrentes",
    description: "Lista as regras de transações recorrentes do usuário.",
    method: "GET",
    path: "/api/recurring-transactions",
    input: {},
    readOnly: true,
  },
  {
    name: "create_recurring_transaction",
    title: "Criar transação recorrente",
    description: "Cria uma regra recorrente e gera as transações/faturas futuras correspondentes.",
    method: "POST",
    path: "/api/recurring-transactions",
    input: {
      type: z.enum(["EXPENSE", "INCOME"]),
      amount: z.number(),
      description: z.string(),
      frequency: z.string().describe("Ex: MONTHLY, WEEKLY, YEARLY"),
      startDate: z.string(),
      endDate: z.string().optional(),
      categoryId: z.string().optional(),
      accountId: z.string().optional(),
      cardId: z.string().optional(),
    },
  },
  {
    name: "update_recurring_transaction",
    title: "Atualizar transação recorrente",
    description: "Atualiza uma regra recorrente (parcial).",
    method: "PUT",
    path: "/api/recurring-transactions/:id",
    input: {
      id: z.string(),
      amount: z.number().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      endDate: z.string().optional(),
    },
  },
  {
    name: "delete_recurring_transaction",
    title: "Excluir transação recorrente",
    description: "Remove a regra recorrente e as transações/vínculos de fatura futuros gerados por ela.",
    method: "DELETE",
    path: "/api/recurring-transactions/:id",
    input: { id: z.string() },
    destructive: true,
  },
];
