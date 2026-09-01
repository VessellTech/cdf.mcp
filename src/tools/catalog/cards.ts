import { z } from "zod";
import type { ToolDef } from "../types.js";

// Campos devolvidos por list_cards e create_card (RETURNING).
const cardShape = {
  id: z.string().optional(),
  userId: z.string().optional(),
  accountId: z.string().optional().nullable(),
  name: z.string().optional(),
  limit: z.number().optional().nullable().describe("Limite do cartão; null = Sem Limite"),
  closingDay: z.number().optional(),
  dueDay: z.number().optional(),
  color: z.string().optional(),
  currency: z.string().optional(),
  limitUsed: z.number().optional(),
  currentInvoice: z.number().optional().describe("Total da fatura atual (não paga)"),
  lastFourDigits: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};

export const cardTools: ToolDef[] = [
  {
    name: "list_cards",
    title: "Listar cartões",
    description:
      "Lista os cartões de crédito do usuário. `currentInvoice` é o total da fatura mais próxima ainda não paga (ordenada por year/month) — 0 se não houver fatura em aberto. Para o valor completo de uma fatura específica (aberta ou fechada) use as tools de fatura (current_invoice/next_invoice/list_pending_invoices), não este campo.",
    method: "GET",
    path: "/api/cards",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(z.object(cardShape)) }),
  },
  {
    name: "create_card",
    title: "Criar cartão",
    description: "Cria um novo cartão de crédito para o usuário autenticado, com limite usado e fatura atual zerados.",
    method: "POST",
    path: "/api/cards",
    input: {
      name: z.string().describe("Nome/apelido do cartão, ex: 'Nubank Roxinho'"),
      limit: z.number().optional().describe("Limite total do cartão. Omita para criar um cartão 'Sem Limite' (sem teto de crédito)"),
      closingDay: z.number().int().describe("Dia do fechamento da fatura (1-31)"),
      dueDay: z.number().int().describe("Dia do vencimento da fatura (1-31)"),
      accountId: z.string().optional().describe("ID da conta usada para pagar a fatura deste cartão"),
      color: z.string().optional().describe("Cor hex para exibição, ex: #3B82F6"),
      currency: z.string().optional().describe("Moeda ISO 4217, default BRL"),
      lastFourDigits: z.string().optional().describe("Últimos 4 dígitos do cartão, só para exibição"),
      brand: z.string().optional().describe("Ex: VISA, MASTERCARD"),
    },
    outputSchema: z.object(cardShape),
  },
  {
    name: "update_card",
    title: "Atualizar cartão",
    description:
      "Atualiza campos de um cartão (parcial — campo omitido mantém o valor atual). Para tornar o cartão 'Sem Limite' envie `limit: \"none\"` (o literal, não omitir e não 0 — omitir mantém o limite atual, 0 vira um limite de fato zero). Não permite alterar `currentInvoice`/`limitUsed` diretamente: esses campos são recalculados automaticamente pelo backend a partir das faturas e transações reais, então não fazem parte do input desta tool.",
    method: "PUT",
    path: "/api/cards/:id",
    input: {
      id: z.string().describe("ID do cartão a atualizar"),
      name: z.string().optional().describe("Novo nome/apelido do cartão"),
      limit: z.union([z.number(), z.literal("none")]).optional().describe("Novo limite total, ou o literal 'none' para remover o teto de crédito (cartão 'Sem Limite')"),
      closingDay: z.number().int().optional().describe("Dia do fechamento da fatura (1-31)"),
      dueDay: z.number().int().optional().describe("Dia do vencimento da fatura (1-31)"),
      accountId: z.string().optional().describe("ID da conta usada para pagar a fatura deste cartão"),
      color: z.string().optional().describe("Cor hex para exibição"),
      currency: z.string().optional().describe("Moeda ISO 4217"),
      lastFourDigits: z.string().optional().describe("Últimos 4 dígitos do cartão"),
      brand: z.string().optional().describe("Ex: VISA, MASTERCARD"),
    },
    // O SQL de update_card (cards.husk) termina em "SELECT count(*) AS count",
    // então a resposta é { count }, não o cartão atualizado.
    outputSchema: z.object({ count: z.number().optional() }),
  },
  {
    name: "delete_card",
    title: "Excluir cartão",
    description:
      "Exclui um cartão de crédito permanentemente. Não há verificação de faturas em aberto ou transações vinculadas antes de excluir.",
    method: "DELETE",
    path: "/api/cards/:id",
    input: { id: z.string().describe("ID do cartão a excluir") },
    destructive: true,
    outputSchema: z.object({ count: z.number().optional() }),
  },
];
