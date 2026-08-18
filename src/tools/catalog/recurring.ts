import { z } from "zod";
import type { ToolDef } from "../types.js";

// --- Shapes de saída (espelham as queries de recurring.husk / recurringlib.go + schema Prisma) ---

const countShape = z.object({
  count: z.number().optional(),
});

const successShape = z.object({
  success: z.boolean().optional(),
});

const recurringShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  accountId: z.string().optional().nullable(),
  cardId: z.string().optional().nullable(),
  type: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().optional(),
  description: z.string().optional(),
  frequency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  nextDueDate: z.string().optional(),
  isActive: z.boolean().optional(),
  destinationAccountId: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  nature: z.enum(["PERSONAL", "PROFESSIONAL", "MIXED", "BUSINESS"]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const createRecurringShape = z.object({
  recurringTransaction: recurringShape.optional(),
  transactionsGenerated: z.number().optional(),
  invoicesCreated: z.number().optional(),
  invoiceErrors: z.number().optional(),
  success: z.boolean().optional(),
});

export const recurringTools: ToolDef[] = [
  {
    name: "list_recurring_transactions",
    title: "Listar transações recorrentes",
    description: "Lista as regras de transações recorrentes do usuário.",
    method: "GET",
    path: "/api/recurring-transactions",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(recurringShape) }),
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
    outputSchema: createRecurringShape,
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
    outputSchema: countShape,
  },
  {
    name: "delete_recurring_transaction",
    title: "Excluir transação recorrente",
    description: "Remove a regra recorrente e as transações/vínculos de fatura futuros gerados por ela.",
    method: "DELETE",
    path: "/api/recurring-transactions/:id",
    input: { id: z.string() },
    destructive: true,
    outputSchema: successShape,
  },
];
