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
    description:
      "Lista as transações do usuário (inclusive de contas conjuntas onde ele é membro), com categoria/conta/cartão/centro de custo/agente/tags já incluídos, mais recentes primeiro (por `date`, não por criação). Sem `from`/`to`/`limit`, traz o histórico inteiro — para não estourar o contexto, use `limit` (e pagine com `offset` se precisar de mais) ou restrinja com `from`/`to`. Para só o que está por vencer/pendente use upcoming_transactions; para totais agregados por mês use analytics_history ou o endpoint de summary.",
    method: "GET",
    path: "/api/transactions",
    input: {
      from: z.string().optional().describe("Data ISO — só transações com date >= from. Default: sem limite inferior"),
      to: z.string().optional().describe("Data ISO — só transações com date <= to. Default: sem limite superior"),
      limit: z.number().int().min(1).max(200).optional().describe("Limita a quantidade de transações retornadas (mais recentes primeiro). Default: sem limite"),
      offset: z.number().int().min(0).optional().describe("Pula os N primeiros resultados — use com limit para paginar"),
      userId: z.string().optional().describe("Só para planejadores (mobilePlanners): id de um cliente vinculado, para ver as transações dele em vez das próprias. Omitido = transações do próprio usuário autenticado. Retorna 403 se o usuário autenticado não for planejador desse cliente"),
    },
    readOnly: true,
    outputSchema: z.object({ data: z.array(transactionShape) }),
  },
  {
    name: "upcoming_transactions",
    title: "Próximas transações",
    description:
      "Lista transações INCOME/EXPENSE (não TRANSFER) dos próximos dias com resumo agregado de `upcoming` (dentro do range) e `overdue` (vencidas e ainda não pagas, sempre incluídas independente do range). `status` filtra por isPaid: default 'pending' (só não pagas) — use 'all' pra ver pagas e pendentes juntas no período.",
    method: "GET",
    path: "/api/transactions/upcoming",
    input: {
      from: z.string().optional().describe("Data ISO início, default hoje"),
      to: z.string().optional().describe("Data ISO fim, default +30 dias"),
      status: z.enum(["pending", "paid", "all"]).optional().describe("Default: pending (só transações não pagas)"),
    },
    readOnly: true,
    outputSchema: upcomingShape,
  },
  {
    name: "create_transaction",
    title: "Criar transação",
    description:
      "Cria uma transação (EXPENSE/INCOME/TRANSFER). Requer accountId ou cardId. Se a transação vai ser considerada paga agora (isPaid não-false e sem scheduledDate futura), valida saldo suficiente na conta (EXPENSE/TRANSFER) ou limite disponível no cartão (EXPENSE) e retorna 400 se faltar — para permitir saldo negativo use confirm_new_transaction. `scheduledDate` no futuro agenda a transação sem tocar saldo/limite até ser confirmada depois (confirm_pending_transaction). `installments` > 1 divide `amount` em parcelas iguais e cria as ocorrências futuras automaticamente. category 'INVESTMENT' + EXPENSE/INCOME atualiza o valor/custo de um Equity (cria um novo via ticker/exchange se não existir nenhum, ou usa/cria um 'Investimentos Gerais' default). Para TRANSFER com goalId, incrementa o progresso da meta. Dispara recálculo de projeções e insights (best-effort) e um alerta de orçamento (push) se estourar categoria.",
    method: "POST",
    path: "/api/transactions",
    input: {
      type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
      amount: z.number().describe("Valor total da transação — se installments > 1, é o valor total, dividido igualmente entre as parcelas"),
      description: z.string().describe("Descrição/título da transação"),
      date: z.string().describe("Data ISO ou dd/mm/yyyy (normalizada automaticamente)"),
      categoryId: z.string().optional().describe("Id da Category do usuário"),
      accountId: z.string().optional().describe("Conta debitada/creditada. Obrigatório se cardId não for informado"),
      cardId: z.string().optional().describe("Cartão usado (só para EXPENSE). Obrigatório se accountId não for informado"),
      destinationAccountId: z.string().optional().describe("Obrigatório para TRANSFER — conta de destino"),
      goalId: z.string().optional().describe("Meta financeira vinculada — só tem efeito (incrementa progresso) quando type é TRANSFER"),
      equityId: z.string().optional().describe("Investimento (Equity) a atualizar diretamente, alternativa a ticker/exchange"),
      costCenterId: z.string().optional().describe("Centro de custo vinculado"),
      agentId: z.string().optional().describe("Contato/agente (Agent) vinculado à transação"),
      installments: z.number().int().optional().describe("Número de parcelas (>1 gera parcelas futuras adicionais, tipicamente usado com cardId)"),
      scheduledDate: z.string().optional().describe("Data ISO futura — agenda a transação como pendente sem afetar saldo/limite até ser confirmada"),
      isPaid: z.boolean().optional().describe("Default: calculado a partir de date/scheduledDate (passado/hoje = true). Force false para lançar como pendente mesmo com data passada"),
      paidDate: z.string().optional().describe("Data ISO em que foi efetivamente paga, se diferente de date"),
      nature: z.string().optional().describe("PERSONAL, PROFESSIONAL, MIXED ou BUSINESS. Default: PERSONAL"),
      ticker: z.string().optional().describe("Ticker do ativo (ex: PETR4) — usado só quando categoryId aponta pra categoria 'INVESTMENT', pra achar/criar o Equity correspondente"),
      exchange: z.string().optional().describe("Bolsa do ativo, usado junto com ticker ao criar um novo Equity"),
      shares: z.number().optional().describe("Quantidade de cotas/ações da operação de investimento, se aplicável"),
    },
    outputSchema: transactionShape,
  },
  {
    name: "confirm_new_transaction",
    title: "Criar transação já confirmada",
    description:
      "Igual a create_transaction, mas SEM validar saldo suficiente — permite deixar a conta negativa (a validação de limite de cartão continua valendo). Use no lugar de create_transaction quando o usuário está registrando algo que sabidamente vai deixar o saldo negativo (ex: import de extrato retroativo) e isso é esperado, não um erro. Não suporta installments, scheduledDate, nature, ticker/exchange/shares — para parcelamento ou investimento use create_transaction.",
    method: "POST",
    path: "/api/transactions/confirm",
    input: {
      type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
      amount: z.number().describe("Valor total da transação"),
      description: z.string().describe("Descrição/título da transação"),
      date: z.string().describe("Data ISO ou dd/mm/yyyy"),
      categoryId: z.string().optional().describe("Id da Category do usuário"),
      accountId: z.string().optional().describe("Obrigatório se cardId não for informado"),
      cardId: z.string().optional().describe("Obrigatório se accountId não for informado"),
      destinationAccountId: z.string().optional().describe("Obrigatório para TRANSFER"),
      goalId: z.string().optional().describe("Meta financeira vinculada — só tem efeito quando type é TRANSFER"),
      equityId: z.string().optional().describe("Investimento (Equity) vinculado"),
      costCenterId: z.string().optional().describe("Centro de custo vinculado"),
      agentId: z.string().optional().describe("Contato/agente (Agent) vinculado"),
      confirmNegativeBalance: z.boolean().optional().describe("true confirma explicitamente que o saldo pode ficar negativo (mesmo efeito de isPaid: true nesta tool — a checagem de saldo já é pulada por padrão)"),
      isPaid: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "Esta tool é para transações já efetivadas (padrão: true, aplica o efeito no saldo/fatura imediatamente). Para lançar como pendente sem afetar saldo, passe isPaid: false ou use create_transaction.",
        ),
    },
    outputSchema: transactionShape,
  },
  {
    name: "confirm_pending_transaction",
    title: "Confirmar transação pendente",
    description:
      "Marca uma transação existente (agendada ou com isPaid: false) como paga agora (paidDate = agora) e aplica o efeito no saldo da conta vinculada. Retorna 400 se a transação já estiver paga. Não reaplica efeito em cartão (limitUsed/fatura) — hoje só transações vinculadas a conta são afetadas por esta confirmação.",
    method: "POST",
    path: "/api/transactions/:id/confirm",
    input: { id: z.string().describe("ID da transação pendente a confirmar") },
    outputSchema: transactionShape,
  },
  {
    name: "update_transaction",
    title: "Atualizar transação",
    description:
      "Atualiza uma transação existente (parcial — campo omitido/vazio mantém o valor atual). Se amount, type ou accountId mudarem, reverte o efeito de saldo da versão antiga e reaplica com os novos valores (retorna 400 se a nova conta não tiver saldo suficiente para EXPENSE/TRANSFER). Não reajusta parcelas irmãs (currentInstallment/totalInstallments) nem faturas de cartão — para mudanças que afetam cartão, prefira excluir e recriar. Dispara recálculo de projeções e insights (best-effort).",
    method: "PUT",
    path: "/api/transactions/:id",
    input: {
      id: z.string().describe("ID da transação a atualizar"),
      type: z.string().optional().describe("EXPENSE, INCOME, TRANSFER ou INVOICE_PAYMENT"),
      category: z.string().optional().describe("Rótulo texto livre da categoria (independente de categoryId)"),
      amount: z.number().optional().describe("Novo valor da transação"),
      description: z.string().optional().describe("Nova descrição/título"),
      date: z.string().optional().describe("Data ISO ou dd/mm/yyyy"),
      categoryId: z.string().optional().describe("Id da Category do usuário"),
      accountId: z.string().optional().describe("Nova conta debitada/creditada"),
      destinationAccountId: z.string().optional().describe("Conta de destino, se type for TRANSFER"),
      cardId: z.string().optional().describe("Novo cartão vinculado"),
      costCenterId: z.string().optional().describe("Novo centro de custo"),
      agentId: z.string().optional().describe("Novo contato/agente vinculado"),
      scheduledDate: z.string().optional().describe("Data ISO — reagenda a transação"),
      nature: z.string().optional().describe("PERSONAL, PROFESSIONAL, MIXED ou BUSINESS"),
      isPaid: z.boolean().optional().describe("Marca/desmarca como paga (sem reverter/aplicar efeito de saldo automaticamente — use confirm_pending_transaction pra isso)"),
      paidDate: z.string().optional().describe("Data ISO em que foi efetivamente paga"),
    },
    outputSchema: countShape,
  },
  {
    name: "delete_transaction",
    title: "Excluir transação",
    description:
      "Exclui uma transação permanentemente e, se ela estava paga (isPaid: true), reverte seu efeito: devolve/desconta o saldo da conta (e da conta de destino, se TRANSFER), decrementa a meta vinculada (se TRANSFER com goalId) e reverte o efeito no cartão/fatura (se cardId). Ação irreversível.",
    method: "DELETE",
    path: "/api/transactions/:id",
    input: { id: z.string().describe("ID da transação a excluir") },
    destructive: true,
    outputSchema: successShape,
  },
];
