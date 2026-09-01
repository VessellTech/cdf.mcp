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
    description: "Lista faturas de cartão de crédito (CreditCardInvoice) do usuário, mais recentes primeiro (ano/mês desc), cada uma com o cartão e as transações vinculadas. Sem filtros retorna faturas em qualquer status (aberta, fechada, paga, parcial, vencida) — para só as pendentes de pagamento use list_pending_invoices, que já aplica esse filtro e ordena por vencimento.",
    method: "GET",
    path: "/api/credit-card-invoices",
    input: {
      status: invoiceStatus.optional().describe("Filtra por status exato da fatura"),
      cardId: z.string().optional().describe("Filtra por um cartão específico"),
    },
    readOnly: true,
    outputSchema: z.object({ data: z.array(invoiceListItemShape) }),
  },
  {
    name: "list_pending_invoices",
    title: "Faturas pendentes",
    description: "Lista as faturas de cartão já fechadas e ainda não totalmente pagas (status CLOSED, OVERDUE ou PARTIAL), ordenadas por data de vencimento crescente. Não inclui faturas OPEN (ciclo ainda em curso, acumulando compras) nem PAID. Use invoice_for_period para o valor da fatura de UM cartão específico (inclusive a que ainda está aberta); use esta tool para o panorama de faturas de cartão pendentes em geral.",
    method: "GET",
    path: "/api/credit-card-invoices/pending",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(invoiceWithCardShape) }),
  },
  {
    name: "get_invoice",
    title: "Detalhe de fatura",
    description: "Detalhe completo de uma fatura de cartão específica: dados do cartão, os vínculos de transação (transactions) e as transações completas (fullTransactions, com categoria/parcela/etc). `id` é o id da fatura (CreditCardInvoice), não do cartão — para buscar pela fatura ativa de um cartão sem saber o id da fatura use invoice_for_period.",
    method: "GET",
    path: "/api/credit-card-invoices/:id",
    input: { id: z.string().describe("Id da fatura (CreditCardInvoice)") },
    readOnly: true,
    outputSchema: invoiceDetailsShape,
  },
  {
    name: "invoice_for_period",
    title: "Fatura do cartão (atual ou próxima)",
    description:
      "Fatura de um cartão pro período pedido em `period` (default 'current'). 'current': a mais antiga ainda não paga (isPaid = false), qualquer que seja seu status; se não houver nenhuma pendente, cai pra fatura do período vigente calculada pelo dia de fechamento/vencimento do cartão. 'next': fatura prevista pro ciclo seguinte ao atual (mês seguinte, mesma lógica de fechamento/vencimento) — use pra saber quanto já está comprometido no próximo fechamento antes dele fechar. Sem transações completas (só os vínculos de valor). Efeito colateral em ambos os casos: se a fatura do período pedido ainda não existir, ela é criada (linha OPEN com total 0) — não é uma leitura pura. `cardId` é o id do cartão, não da fatura.",
    method: "GET",
    path: "/api/credit-card-invoices/current/:cardId",
    resolvePath: (v) =>
      `/api/credit-card-invoices/${v.period === "next" ? "next" : "current"}/${encodeURIComponent(String(v.cardId))}`,
    input: {
      cardId: z.string().describe("Id do cartão (Card)"),
      period: z.enum(["current", "next"]).optional().describe("Default: 'current'"),
    },
    outputSchema: invoiceWithTransactionsShape,
  },
  {
    name: "invoice_allocation_preview",
    title: "Prévia de alocação de faturas",
    description: "Lista transações de cartão cujo período (mês/ano) de fatura calculado hoje diverge do período em que estão realmente alocadas (currentInvoiceMonth/Year vs correctedInvoiceMonth/Year) — útil para detectar faturas desalinhadas antes de corrigir. Não altera nada; é sempre resultado de leitura mesmo não sendo readOnly no schema (nenhuma escrita ocorre nesta rota).",
    method: "GET",
    path: "/api/credit-card-invoices/allocation-preview",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(allocationPreviewShape), total: z.number().optional() }),
  },
  {
    name: "invoice_orphan_count",
    title: "Contar transações órfãs de cartão",
    description: "Conta despesas de cartão (Transaction.type = EXPENSE com cardId preenchido) que não têm nenhum vínculo em CreditCardInvoiceTransaction — normalmente transações antigas lançadas antes do sistema de faturas existir, ou importadas sem gerar o vínculo.",
    method: "GET",
    path: "/api/credit-card-invoices/orphan-count",
    input: {},
    readOnly: true,
    outputSchema: z.object({ orphanCount: z.number().optional() }),
  },
  {
    name: "validate_current_invoices",
    title: "Validar faturas atuais",
    description: "Recalcula e sobrescreve `currentInvoice` (soma das faturas não pagas) de TODOS os cartões do usuário, incondicionalmente — não só os desalinhados. Retorna, por cartão, o valor anterior e o novo, com `needsCorrection = true` quando a diferença era maior que 0.01. Rode depois de operações em lote (ex: reimportação de transações) que possam ter deixado `Card.currentInvoice` dessincronizado.",
    method: "POST",
    path: "/api/credit-card-invoices/validate-current-invoice",
    input: {},
    destructive: true,
    outputSchema: z.object({ data: z.array(invoiceValidationShape) }),
  },
  {
    name: "pay_invoice",
    title: "Pagar fatura",
    description:
      "Registra pagamento (total ou parcial) de uma fatura de cartão: soma `amount` a paidAmount, atualiza status (PAID se cobrir o total, PARTIAL se parcial) e, só quando `accountId` é informado, debita da conta — cria uma transação de despesa 'Fatura de Cartão', reduz o saldo da conta, libera o limite do cartão usado (limitUsed) e recalcula `Card.currentInvoice`. Sem `accountId`, marca a fatura como paga/parcial sem mexer em nenhuma conta (útil quando o pagamento já foi lançado manualmente em outro lugar).",
    method: "POST",
    path: "/api/credit-card-invoices/:id/pay",
    input: {
      id: z.string().describe("Id da fatura (CreditCardInvoice)"),
      amount: z.number().optional().describe("Valor a abater do saldo da fatura. Default: valor total da fatura (paga integralmente). Envie um valor menor para pagamento parcial"),
      accountId: z.string().optional().describe("Conta de onde debitar o pagamento. Se omitido, só marca a fatura como paga, sem criar transação nem mexer em saldo/limite"),
    },
    outputSchema: invoiceWithCardShape,
  },
];
