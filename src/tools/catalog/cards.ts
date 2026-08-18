import { z } from "zod";
import type { ToolDef } from "../types.js";

export const cardTools: ToolDef[] = [
  {
    name: "list_cards",
    title: "Listar cartões",
    description: "Lista os cartões de crédito do usuário, com a fatura atual (não paga) de cada um.",
    method: "GET",
    path: "/api/cards",
    input: {},
    readOnly: true,
  },
  {
    name: "create_card",
    title: "Criar cartão",
    description: "Cria um novo cartão de crédito.",
    method: "POST",
    path: "/api/cards",
    input: {
      name: z.string(),
      limit: z.number().describe("Limite total do cartão"),
      closingDay: z.number().int().describe("Dia do fechamento da fatura (1-31)"),
      dueDay: z.number().int().describe("Dia do vencimento da fatura (1-31)"),
      accountId: z.string().optional().describe("Conta associada ao pagamento da fatura"),
      lastFourDigits: z.string().optional(),
      brand: z.string().optional().describe("Ex: VISA, MASTERCARD"),
    },
  },
  {
    name: "update_card",
    title: "Atualizar cartão",
    description: "Atualiza campos de um cartão (parcial — campo vazio mantém o valor atual).",
    method: "PUT",
    path: "/api/cards/:id",
    input: {
      id: z.string(),
      name: z.string().optional(),
      limit: z.number().optional(),
      closingDay: z.number().int().optional(),
      dueDay: z.number().int().optional(),
      accountId: z.string().optional(),
      lastFourDigits: z.string().optional(),
      brand: z.string().optional(),
    },
  },
  {
    name: "delete_card",
    title: "Excluir cartão",
    description: "Exclui um cartão de crédito.",
    method: "DELETE",
    path: "/api/cards/:id",
    input: { id: z.string() },
    destructive: true,
  },
];
