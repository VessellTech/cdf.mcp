import { z } from "zod";
import type { ToolDef } from "../types.js";

export const accountTools: ToolDef[] = [
  {
    name: "list_accounts",
    title: "Listar contas",
    description: "Lista as contas bancárias/carteiras do usuário (próprias e compartilhadas).",
    method: "GET",
    path: "/api/accounts",
    input: {},
    readOnly: true,
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
  },
  {
    name: "delete_account",
    title: "Excluir conta",
    description: "Exclui uma conta (só o dono pode excluir).",
    method: "DELETE",
    path: "/api/accounts/:id",
    input: { id: z.string() },
    destructive: true,
  },
];
