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
    description: "Lista as contas bancárias/carteiras do usuário (próprias e compartilhadas).",
    method: "GET",
    path: "/api/accounts",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(z.object(listAccountShape)) }),
  },
  {
    name: "create_account",
    title: "Criar conta",
    description: "Cria uma nova conta bancária/carteira.",
    method: "POST",
    path: "/api/accounts",
    input: {
      name: z.string().describe("Nome da conta, ex: 'Nubank', 'Carteira'"),
      type: z.string().describe("Tipo da conta, ex: CHECKING, SAVINGS, WALLET, INVESTMENT"),
      balance: z.number().optional().describe("Saldo inicial"),
      currency: z.string().optional().describe("Moeda ISO 4217, default BRL"),
      bankCode: z.string().optional(),
    },
    outputSchema: z.object(accountFields),
  },
  {
    name: "update_account",
    title: "Atualizar conta",
    description: "Atualiza campos de uma conta existente (parcial — campo vazio mantém o valor atual).",
    method: "PUT",
    path: "/api/accounts/:id",
    input: {
      id: z.string().describe("ID da conta"),
      name: z.string().optional(),
      type: z.string().optional(),
      balance: z.number().optional(),
      currency: z.string().optional(),
      bankCode: z.string().optional(),
    },
    outputSchema: z.object(accountFields),
  },
  {
    name: "delete_account",
    title: "Excluir conta",
    description: "Exclui uma conta (só o dono pode excluir).",
    method: "DELETE",
    path: "/api/accounts/:id",
    input: { id: z.string() },
    destructive: true,
    outputSchema: z.object({ count: z.number().optional() }),
  },
];
