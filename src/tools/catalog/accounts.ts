import { z } from "zod";
import type { ToolDef } from "../types.js";

// Sub-objeto do dono/membro da conta (json_build_object em list_accounts) —
// name/picture são nullable no User.
const userRefShape = {
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string().optional(),
  picture: z.string().optional().nullable(),
};

// Campos devolvidos por create_account/update_account (RETURNING).
const accountFields = {
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["CHECKING", "SAVINGS", "WALLET", "INVESTMENT"]).optional(),
  currency: z.string().optional(),
  balance: z.number().optional(),
  balanceDate: z.string().optional().nullable(),
  color: z.string().optional(),
  bankCode: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};

const memberShape = {
  id: z.string().optional(),
  accountId: z.string().optional(),
  userId: z.string().optional(),
  role: z.enum(["OWNER", "MEMBER"]).optional(),
  createdAt: z.string().optional(),
  user: z.object(userRefShape).optional(),
};

// list_accounts — conta com campos de compartilhamento e objetos aninhados.
const listAccountShape = {
  ...accountFields,
  myRole: z.enum(["OWNER", "MEMBER"]).optional(),
  isShared: z.boolean().optional(),
  user: z.object(userRefShape).optional().describe("Dono da conta"),
  members: z.array(z.object(memberShape)).optional().describe("Membros da conta conjunta"),
};

export const accountTools: ToolDef[] = [
  {
    name: "list_accounts",
    title: "Listar contas",
    description:
      "Lista as contas bancárias/carteiras do usuário: as que ele é dono (`userId`) e as contas conjuntas onde ele é membro (via AccountMember). Cada item traz `myRole` (OWNER/MEMBER na conta), `isShared` e a lista completa de `members` com dados básicos de cada usuário. Ordenado por criação, mais recente primeiro.",
    method: "GET",
    path: "/api/accounts",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(z.object(listAccountShape)) }),
  },
  {
    name: "create_account",
    title: "Criar conta",
    description:
      "Cria uma conta bancária/carteira nova com o usuário autenticado como OWNER. `balance` é o saldo inicial (default 0), não um saldo calculado a partir de transações — o saldo depois é ajustado incrementalmente conforme transações pagas são criadas/confirmadas/excluídas.",
    method: "POST",
    path: "/api/accounts",
    input: {
      name: z.string().describe("Nome da conta, ex: 'Nubank', 'Carteira'"),
      type: z.string().describe("Tipo da conta, ex: CHECKING, SAVINGS, WALLET, INVESTMENT"),
      balance: z.number().optional().describe("Saldo inicial (default 0) — não recalculado a partir de transações, é o ponto de partida"),
      currency: z.string().optional().describe("Moeda ISO 4217, default BRL"),
      bankCode: z.string().optional().describe("Código do banco (ex: FEBRABAN), opcional, sem validação de formato"),
      color: z.string().optional().describe("Cor hex para exibição, ex: #3B82F6"),
      balanceDate: z.string().optional().describe("Data ISO de referência do saldo inicial informado. Default: null (sem data associada)"),
    },
    outputSchema: z.object(accountFields),
  },
  {
    name: "update_account",
    title: "Atualizar conta",
    description:
      "Atualiza campos de uma conta existente (parcial — campo omitido/vazio mantém o valor atual). Tanto o dono (OWNER) quanto membros (MEMBER) de uma conta conjunta podem chamar esta tool; para excluir a conta, porém, só o dono pode (veja delete_account). Editar `balance` aqui sobrescreve o saldo diretamente, sem relação com o histórico de transações — não é o mesmo que registrar uma transação de ajuste.",
    method: "PUT",
    path: "/api/accounts/:id",
    input: {
      id: z.string().describe("ID da conta a atualizar"),
      name: z.string().optional(),
      type: z.string().optional().describe("CHECKING, SAVINGS, WALLET ou INVESTMENT"),
      balance: z.number().optional().describe("Sobrescreve o saldo diretamente (não é uma transação — não afeta fatura de cartão nem histórico)"),
      currency: z.string().optional().describe("Moeda ISO 4217"),
      bankCode: z.string().optional(),
      color: z.string().optional().describe("Cor hex para exibição, ex: #3B82F6"),
      balanceDate: z.string().optional().describe("Data ISO de referência do saldo informado em `balance`"),
    },
    outputSchema: z.object(accountFields),
  },
  {
    name: "delete_account",
    title: "Excluir conta",
    description:
      "Exclui uma conta permanentemente. Só o dono (`userId` da conta) pode excluir — membros de uma conta conjunta não conseguem, mesmo podendo editá-la via update_account. Não há confirmação adicional nem verificação de transações/cartões vinculados antes de excluir.",
    method: "DELETE",
    path: "/api/accounts/:id",
    input: { id: z.string().describe("ID da conta a excluir") },
    destructive: true,
    outputSchema: z.object({ count: z.number().optional() }),
  },
];
