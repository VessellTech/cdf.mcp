import { z } from "zod";
import type { ToolDef } from "../types.js";

// --- Shapes de saída (espelham as queries de transactions.husk + schema Prisma) ---

const countShape = z.object({
  count: z.number().optional(),
});

const successShape = z.object({
  success: z.boolean().optional(),
});

const transactionType = z.enum(["EXPENSE", "INCOME", "TRANSFER", "INVOICE_PAYMENT"]);
const transactionNature = z.enum(["PERSONAL", "PROFESSIONAL", "MIXED", "BUSINESS"]);

// categoryModel — objeto aninhado (LEFT JOIN com Category; null quando não há categoryId).
const categoryModelShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["EXPENSE", "INCOME"]).optional(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  globalCategoryId: z.string().optional().nullable(),
  globalSubcategoryId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// account / destinationAccount — objeto aninhado (LEFT JOIN; null quando a conta não existe).
const accountShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["CHECKING", "SAVINGS", "WALLET", "INVESTMENT"]).optional(),
  currency: z.string().optional(),
  balance: z.number().optional(),
  color: z.string().optional(),
  bankCode: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// card — objeto aninhado (LEFT JOIN; null quando a transação não usa cartão).
const cardShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  accountId: z.string().optional().nullable(),
  name: z.string().optional(),
  limit: z.number().optional().nullable(),
  closingDay: z.number().optional(),
  dueDay: z.number().optional(),
  color: z.string().optional(),
  currency: z.string().optional(),
  currentInvoice: z.number().optional(),
  limitUsed: z.number().optional(),
  lastFourDigits: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const costCenterShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const agentShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  document: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const tagShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  color: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Transação com includes (list_transactions / transaction_with_includes).
// Os campos "Id" são nullable: no GET vêm como null (coluna nullable), no
// POST/PUT/confirm vêm como "" (COALESCE no RETURNING).
const transactionShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  accountId: z.string().optional().nullable(),
  type: transactionType.optional(),
  category: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  amount: z.number().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  destinationAccountId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  equityId: z.string().optional().nullable(),
  cardId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
  currentInstallment: z.number().optional().nullable(),
  totalInstallments: z.number().optional().nullable(),
  recurringTransactionId: z.string().optional().nullable(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  billReminderSentAt: z.string().optional().nullable(),
  nature: transactionNature.optional(),
  categoryModel: categoryModelShape.optional().nullable(),
  account: accountShape.optional().nullable(),
  card: cardShape.optional().nullable(),
  costCenter: costCenterShape.optional().nullable(),
  agent: agentShape.optional().nullable(),
  destinationAccount: accountShape.optional().nullable(),
  tags: z.array(tagShape).optional(),
});

// Item de GET /api/transactions/upcoming — mesmo item, com dias até a data.
const upcomingTransactionShape = transactionShape.extend({
  daysUntil: z.number().optional(),
});

const upcomingShape = z.object({
  generatedAt: z.string().optional(),
  range: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  summary: z
    .object({
      upcoming: z
        .object({
          income: z.number().optional(),
          expense: z.number().optional(),
          net: z.number().optional(),
          count: z.number().optional(),
          pendingCount: z.number().optional(),
        })
        .optional(),
      overdue: z
        .object({
          income: z.number().optional(),
          expense: z.number().optional(),
          net: z.number().optional(),
          count: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  transactions: z.array(upcomingTransactionShape).optional(),
});

export const transactionTools: ToolDef[] = [
  {
    name: "list_transactions",
    title: "Listar transações",
    description: "Lista as transações do usuário, com conta/categoria/tags incluídas (mais recentes primeiro).",
    method: "GET",
    path: "/api/transactions",
    input: {
      limit: z.number().int().min(1).max(200).optional().describe("Limita a quantidade de transações retornadas (mais recentes primeiro)"),
    },
    readOnly: true,
    outputSchema: z.object({ data: z.array(transactionShape) }),
  },
  {
    name: "upcoming_transactions",
    title: "Próximas transações",
    description: "Lista transações dos próximos dias (agendadas/pendentes) com resumo.",
    method: "GET",
    path: "/api/transactions/upcoming",
    input: {
      from: z.string().optional().describe("Data ISO início, default hoje"),
      to: z.string().optional().describe("Data ISO fim, default +30 dias"),
      status: z.enum(["pending", "paid", "all"]).optional(),
    },
    readOnly: true,
    outputSchema: upcomingShape,
  },
  {
    name: "create_transaction",
    title: "Criar transação",
    description:
      "Cria uma transação (expense/income/transfer). Requer accountId ou cardId. Valida saldo/limite disponível.",
    method: "POST",
    path: "/api/transactions",
    input: {
      type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
      amount: z.number(),
      description: z.string(),
      date: z.string().describe("Data ISO ou dd/mm/yyyy"),
      categoryId: z.string().optional(),
      accountId: z.string().optional(),
      cardId: z.string().optional(),
      destinationAccountId: z.string().optional().describe("Obrigatório para TRANSFER"),
      goalId: z.string().optional(),
      equityId: z.string().optional(),
      costCenterId: z.string().optional(),
      agentId: z.string().optional(),
      installments: z.number().int().optional().describe("Número de parcelas (cartão)"),
      scheduledDate: z.string().optional().describe("Se futura, agenda sem tocar saldo"),
      isPaid: z.boolean().optional(),
      paidDate: z.string().optional(),
      nature: z.string().optional(),
      ticker: z.string().optional().describe("Ticker do ativo, para transação de investimento"),
      exchange: z.string().optional(),
      shares: z.number().optional(),
    },
    outputSchema: transactionShape,
  },
  {
    name: "confirm_new_transaction",
    title: "Criar transação já confirmada",
    description: "Mesmo que create_transaction, mas sem checar saldo (permite saldo negativo).",
    method: "POST",
    path: "/api/transactions/confirm",
    input: {
      type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
      amount: z.number(),
      description: z.string(),
      date: z.string(),
      categoryId: z.string().optional(),
      accountId: z.string().optional(),
      cardId: z.string().optional(),
      destinationAccountId: z.string().optional(),
      goalId: z.string().optional(),
      equityId: z.string().optional(),
      costCenterId: z.string().optional(),
      confirmNegativeBalance: z.boolean().optional(),
    },
    outputSchema: transactionShape,
  },
  {
    name: "confirm_pending_transaction",
    title: "Confirmar transação pendente",
    description: "Marca uma transação existente como paga e aplica o efeito no saldo.",
    method: "POST",
    path: "/api/transactions/:id/confirm",
    input: { id: z.string() },
    outputSchema: transactionShape,
  },
  {
    name: "update_transaction",
    title: "Atualizar transação",
    description: "Atualiza uma transação (parcial). Reverte e reaplica o efeito de saldo se amount/type/accountId mudarem.",
    method: "PUT",
    path: "/api/transactions/:id",
    input: {
      id: z.string(),
      type: z.string().optional(),
      amount: z.number().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      categoryId: z.string().optional(),
      accountId: z.string().optional(),
      cardId: z.string().optional(),
      isPaid: z.boolean().optional(),
      paidDate: z.string().optional(),
    },
    outputSchema: countShape,
  },
  {
    name: "delete_transaction",
    title: "Excluir transação",
    description: "Exclui uma transação e reverte seu efeito no saldo/fatura/meta se estava paga.",
    method: "DELETE",
    path: "/api/transactions/:id",
    input: { id: z.string() },
    destructive: true,
    outputSchema: successShape,
  },
];
