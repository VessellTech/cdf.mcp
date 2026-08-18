import { z } from "zod";
import type { ToolDef } from "../types.js";

const equitySchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional().describe("Tipo do ativo — ex: stocks, crypto, real-estate-house"),
  value: z.number().optional(),
  acquisitionDate: z.string().optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  cost: z.number().optional(),
  ticker: z.string().optional().nullable(),
  exchange: z.string().optional().nullable(),
  shares: z.number().optional().nullable(),
});

const equityValuationSchema = z.object({
  id: z.string().optional(),
  equityId: z.string().optional(),
  value: z.number().optional(),
  cost: z.number().optional(),
  asOf: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const equityTools: ToolDef[] = [
  {
    name: "list_equities",
    title: "Listar investimentos",
    description: "Lista os ativos de investimento (equities) do usuário.",
    method: "GET",
    path: "/api/equities",
    input: {},
    outputSchema: z.object({ data: z.array(equitySchema) }),
    readOnly: true,
  },
  {
    name: "create_equity",
    title: "Criar investimento",
    description: "Cria um ativo de investimento com uma avaliação inicial.",
    method: "POST",
    path: "/api/equities",
    input: {
      name: z.string(),
      type: z.string().describe("Ex: STOCK, FUND, CRYPTO, REAL_ESTATE"),
      ticker: z.string().optional(),
      exchange: z.string().optional(),
      value: z.number(),
      cost: z.number().optional(),
    },
    outputSchema: equitySchema,
  },
  {
    name: "update_equity",
    title: "Atualizar investimento",
    description: "Atualiza um investimento; registra nova avaliação se value/cost mudarem.",
    method: "PUT",
    path: "/api/equities/:id",
    input: { id: z.string(), name: z.string().optional(), value: z.number().optional(), cost: z.number().optional(), ticker: z.string().optional() },
    outputSchema: equitySchema,
  },
  {
    name: "delete_equity",
    title: "Excluir investimento",
    description: "Exclui um ativo de investimento.",
    method: "DELETE",
    path: "/api/equities/:id",
    input: { id: z.string() },
    outputSchema: z.object({ count: z.number().optional() }),
    destructive: true,
  },
  {
    name: "list_equity_valuations",
    title: "Histórico de avaliações",
    description: "Histórico de avaliações (valor ao longo do tempo) de um investimento.",
    method: "GET",
    path: "/api/equities/:id/valuations",
    input: { id: z.string() },
    outputSchema: z.object({ data: z.array(equityValuationSchema) }),
    readOnly: true,
  },
  {
    name: "add_equity_valuation",
    title: "Adicionar avaliação",
    description: "Registra uma nova avaliação de valor para um investimento.",
    method: "POST",
    path: "/api/equities/:id/valuations",
    input: { id: z.string(), value: z.number(), date: z.string().optional() },
    outputSchema: equityValuationSchema,
  },
  {
    name: "investments_workspace",
    title: "Visão geral de investimentos",
    description: "Holdings, totais, alocação por tipo, fluxos dos últimos 6 meses e movimentações recentes.",
    method: "GET",
    path: "/api/investments/workspace",
    input: {},
    outputSchema: z.object({
      equities: z.array(equitySchema).optional(),
      holdings: z.array(
        z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          type: z.string().optional(),
          acquisitionDate: z.string().optional(),
          currentValue: z.number().optional(),
          invested: z.number().optional(),
          netGain: z.number().optional(),
          netGainPct: z.number().optional(),
        }),
      ).optional(),
      totals: z
        .object({
          currentValue: z.number().optional(),
          investedCapital: z.number().optional(),
          netGain: z.number().optional(),
          netGainPct: z.number().optional(),
          averageTicket: z.number().optional(),
          averageContribution: z.number().optional(),
        })
        .optional(),
      allocation: z.array(z.object({ label: z.string().optional(), value: z.number().optional() })).optional(),
      flows: z
        .array(
          z.object({
            month: z.string().optional().describe("Rótulo curto do mês (ex: JAN.)"),
            contributions: z.number().optional(),
            withdrawals: z.number().optional(),
            net: z.number().optional(),
          }),
        )
        .optional(),
      recentMovements: z
        .array(
          z.object({
            id: z.string().optional(),
            description: z.string().optional(),
            date: z.string().optional(),
            amount: z.number().optional(),
            type: z.string().optional(),
            equityId: z.string().optional(),
          }),
        )
        .optional(),
    }),
    readOnly: true,
  },
];
