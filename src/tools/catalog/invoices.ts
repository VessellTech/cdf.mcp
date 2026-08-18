import { z } from "zod";
import type { ToolDef } from "../types.js";

export const invoiceTools: ToolDef[] = [
  {
    name: "list_invoices",
    title: "Listar faturas de cartão",
    description: "Lista todas as faturas de cartão de crédito do usuário.",
    method: "GET",
    path: "/api/credit-card-invoices",
    input: {},
    readOnly: true,
  },
  {
    name: "list_pending_invoices",
    title: "Faturas pendentes",
    description: "Lista as faturas de cartão ainda não pagas.",
    method: "GET",
    path: "/api/credit-card-invoices/pending",
    input: {},
    readOnly: true,
  },
  {
    name: "get_invoice",
    title: "Detalhe de fatura",
    description: "Detalhe de uma fatura de cartão específica, com transações.",
    method: "GET",
    path: "/api/credit-card-invoices/:id",
    input: { id: z.string() },
    readOnly: true,
  },
  {
    name: "current_invoice",
    title: "Fatura atual do cartão",
    description: "Fatura não paga mais antiga de um cartão.",
    method: "GET",
    path: "/api/credit-card-invoices/current/:cardId",
    input: { cardId: z.string() },
    readOnly: true,
  },
  {
    name: "pay_invoice",
    title: "Pagar fatura",
    description: "Marca uma fatura como paga, opcionalmente debitando de uma conta.",
    method: "POST",
    path: "/api/credit-card-invoices/:id/pay",
    input: { id: z.string(), accountId: z.string().optional() },
  },
];
