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
    description:
      "Lista as regras de transações recorrentes do usuário (assinaturas, salário, aluguel etc.), ativas e inativas, mais recentes primeiro. Cada regra já gerou transações reais na criação (veja create_recurring_transaction) — esta tool retorna só a regra, não as transações geradas; use list_transactions/upcoming_transactions para essas.",
    method: "GET",
    path: "/api/recurring-transactions",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(recurringShape) }),
  },
  {
    name: "create_recurring_transaction",
    title: "Criar transação recorrente",
    description:
      "Cria uma regra recorrente e, de uma vez, já gera todas as transações concretas entre startDate e endDate (default endDate: 1 ano após startDate) — as datadas até hoje entram como pagas e afetam o saldo da conta imediatamente; as futuras entram como pendentes. Se cardId for informado, também cria/vincula as faturas de cartão correspondentes a cada ocorrência EXPENSE. Diferente de Transaction, RecurringTransaction não tem categoryId (FK) — `category` é só um rótulo texto livre.",
    method: "POST",
    path: "/api/recurring-transactions",
    input: {
      type: z.enum(["EXPENSE", "INCOME"]),
      amount: z.number().describe("Valor de cada ocorrência gerada"),
      description: z.string(),
      frequency: z.string().describe("Ex: MONTHLY, WEEKLY, YEARLY"),
      startDate: z.string().describe("Data ISO da primeira ocorrência"),
      endDate: z.string().optional().describe("Data ISO da última ocorrência a gerar. Default: 1 ano após startDate"),
      category: z.string().optional().describe("Rótulo livre da categoria (texto, não é um categoryId/FK — RecurringTransaction não referencia a tabela Category)"),
      accountId: z.string().optional().describe("Conta usada para débito/crédito de cada ocorrência"),
      cardId: z.string().optional().describe("Cartão usado para ocorrências EXPENSE — gera fatura correspondente para cada uma"),
      destinationAccountId: z.string().optional().describe("Conta de destino, se as ocorrências forem transferências"),
      costCenterId: z.string().optional(),
      nature: z.enum(["PERSONAL", "PROFESSIONAL", "MIXED", "BUSINESS"]).optional().describe("Default: PERSONAL"),
    },
    outputSchema: createRecurringShape,
  },
  {
    name: "update_recurring_transaction",
    title: "Atualizar transação recorrente",
    description:
      "Atualiza a regra recorrente (parcial — campo omitido/vazio mantém o valor atual). Só altera a regra em si: não retroage nem edita as transações já geradas por ela (use update_transaction/delete_transaction para essas), e não gera novas ocorrências — dispara apenas recálculo de projeções/insights (analytics.recalculate + insights).",
    method: "PUT",
    path: "/api/recurring-transactions/:id",
    input: {
      id: z.string().describe("ID da regra recorrente a atualizar"),
      type: z.enum(["EXPENSE", "INCOME"]).optional(),
      category: z.string().optional().describe("Rótulo livre da categoria (texto)"),
      amount: z.number().optional().describe("Novo valor — vale só para ocorrências futuras ainda não geradas, não retroage"),
      description: z.string().optional(),
      frequency: z.string().optional().describe("Ex: MONTHLY, WEEKLY, YEARLY"),
      startDate: z.string().optional().describe("Data ISO"),
      endDate: z.string().optional().describe("Data ISO"),
      accountId: z.string().optional(),
      cardId: z.string().optional(),
      destinationAccountId: z.string().optional(),
      costCenterId: z.string().optional(),
      isActive: z.boolean().optional().describe("false pausa a regra (sem gerar novas ocorrências), sem excluir as já geradas"),
    },
    outputSchema: countShape,
  },
  {
    name: "delete_recurring_transaction",
    title: "Excluir transação recorrente",
    description:
      "Remove a regra recorrente e TODAS as transações que ela já gerou (inclusive futuras/pendentes e vínculos de fatura de cartão) — reverte o limite usado do cartão das ocorrências já pagas antes de apagar. Ação irreversível; para só parar de gerar novas ocorrências sem apagar o histórico, use update_recurring_transaction com isActive: false.",
    method: "DELETE",
    path: "/api/recurring-transactions/:id",
    input: { id: z.string().describe("ID da regra recorrente a excluir") },
    destructive: true,
    outputSchema: successShape,
  },
];
