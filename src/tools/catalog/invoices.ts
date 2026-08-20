import { z } from "zod";
import type { ToolDef } from "../types.js";

// --- Shapes de saída (espelham as queries de invoices.husk / schema Prisma) ---

const invoiceStatus = z.enum(["OPEN", "CLOSED", "PAID", "PARTIAL", "OVERDUE"]);

const invoiceTxShape = z.object({
  id: z.string().optional(),
  invoiceId: z.string().optional(),
  transactionId: z.string().optional(),
  amount: z.number().optional(),
  createdAt: z.string().optional(),
});

const invoiceCardShape = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  color: z.string().optional(),
  lastFourDigits: z.string().optional().nullable(),
});

const invoiceBaseShape = z.object({
  id: z.string().optional(),
  cardId: z.string().optional(),
  userId: z.string().optional(),
  month: z.number().optional(),
  year: z.number().optional(),
  closingDate: z.string().optional(),
  dueDate: z.string().optional(),
  totalAmount: z.number().optional(),
  isPaid: z.boolean().optional(),
  paidAmount: z.number().optional(),
  paidDate: z.string().optional().nullable(),
  status: invoiceStatus.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const invoiceListItemShape = invoiceBaseShape.extend({
  card: invoiceCardShape.optional(),
  transactions: z.array(invoiceTxShape).optional(),
});

const invoiceWithCardShape = invoiceBaseShape.extend({
  card: invoiceCardShape.optional(),
});

const invoiceWithTransactionsShape = invoiceBaseShape.extend({
  transactions: z.array(invoiceTxShape).optional(),
});

const fullCardShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  color: z.string().optional(),
  lastFourDigits: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  limit: z.number().optional().nullable(),
  closingDay: z.number().optional(),
  dueDay: z.number().optional(),
  brand: z.string().optional().nullable(),
  currency: z.string().optional(),
  currentInvoice: z.number().optional(),
  limitUsed: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const fullTransactionShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  accountId: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z.number().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  destinationAccountId: z.string().optional(),
  equityId: z.string().optional(),
  cardId: z.string().optional(),
  goalId: z.string().optional(),
  currentInstallment: z.number().optional().nullable(),
  totalInstallments: z.number().optional().nullable(),
  recurringTransactionId: z.string().optional(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  nature: z.enum(["PERSONAL", "PROFESSIONAL", "MIXED", "BUSINESS"]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const invoiceDetailsShape = invoiceBaseShape.extend({
  card: fullCardShape.optional(),
  transactions: z.array(invoiceTxShape).optional(),
  fullTransactions: z.array(fullTransactionShape).optional(),
});

const allocationPreviewShape = z.object({
  id: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().optional(),
  date: z.string().optional(),
  cardName: z.string().optional(),
  closingDay: z.number().optional(),
  dueDay: z.number().optional(),
  currentInvoiceMonth: z.number().optional().nullable(),
  currentInvoiceYear: z.number().optional().nullable(),
  correctedInvoiceMonth: z.number().optional(),
  correctedInvoiceYear: z.number().optional(),
});

const invoiceValidationShape = z.object({
  cardId: z.string().optional(),
  cardName: z.string().optional(),
  previousValue: z.number().optional(),
  newValue: z.number().optional(),
  difference: z.number().optional(),
  needsCorrection: z.boolean().optional(),
});

export const invoiceTools: ToolDef[] = [
  {
    name: "list_invoices",
    title: "Listar faturas de cartão",
    description: "Lista todas as faturas de cartão de crédito do usuário.",
    method: "GET",
    path: "/api/credit-card-invoices",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(invoiceListItemShape) }),
  },
  {
    name: "list_pending_invoices",
    title: "Faturas pendentes",
    description: "Lista as faturas de cartão ainda não pagas.",
    method: "GET",
    path: "/api/credit-card-invoices/pending",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(invoiceWithCardShape) }),
  },
  {
    name: "get_invoice",
    title: "Detalhe de fatura",
    description: "Detalhe de uma fatura de cartão específica, com transações.",
    method: "GET",
    path: "/api/credit-card-invoices/:id",
    input: { id: z.string() },
    readOnly: true,
    outputSchema: invoiceDetailsShape,
  },
  {
    name: "current_invoice",
    title: "Fatura atual do cartão",
    description: "Fatura não paga mais antiga de um cartão.",
    method: "GET",
    path: "/api/credit-card-invoices/current/:cardId",
    input: { cardId: z.string() },
    readOnly: true,
    outputSchema: invoiceWithTransactionsShape,
  },
  {
    name: "next_invoice",
    title: "Próxima fatura do cartão",
    description: "Retorna a fatura prevista para o próximo período do cartão.",
    method: "GET",
    path: "/api/credit-card-invoices/next/:cardId",
    input: { cardId: z.string().describe("ID do cartão") },
    // O backend cria a fatura se ela ainda não existir; não é uma leitura pura.
    outputSchema: invoiceWithTransactionsShape,
  },
  {
    name: "invoice_allocation_preview",
    title: "Prévia de alocação de faturas",
    description: "Lista transações de cartão vinculadas à fatura errada e mostra a alocação esperada.",
    method: "GET",
    path: "/api/credit-card-invoices/allocation-preview",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(allocationPreviewShape), total: z.number().optional() }),
  },
  {
    name: "invoice_orphan_count",
    title: "Contar transações órfãs de cartão",
    description: "Conta despesas de cartão que não possuem vínculo com uma fatura.",
    method: "GET",
    path: "/api/credit-card-invoices/orphan-count",
    input: {},
    readOnly: true,
    outputSchema: z.object({ orphanCount: z.number().optional() }),
  },
  {
    name: "validate_current_invoices",
    title: "Validar faturas atuais",
    description: "Recalcula o total atual de cada cartão e corrige divergências persistidas.",
    method: "POST",
    path: "/api/credit-card-invoices/validate-current-invoice",
    input: {},
    destructive: true,
    outputSchema: z.object({ data: z.array(invoiceValidationShape) }),
  },
  {
    name: "pay_invoice",
    title: "Pagar fatura",
    description: "Marca uma fatura como paga, opcionalmente debitando de uma conta.",
    method: "POST",
    path: "/api/credit-card-invoices/:id/pay",
    input: { id: z.string(), accountId: z.string().optional() },
    outputSchema: invoiceWithCardShape,
  },
];
