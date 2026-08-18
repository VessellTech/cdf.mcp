import { z } from "zod";
import type { ToolDef } from "../types.js";

export const equityTools: ToolDef[] = [
  { name: "list_equities", title: "Listar investimentos", description: "Lista os ativos de investimento (equities) do usuário.", method: "GET", path: "/api/equities", input: {}, readOnly: true },
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
  },
  {
    name: "update_equity",
    title: "Atualizar investimento",
    description: "Atualiza um investimento; registra nova avaliação se value/cost mudarem.",
    method: "PUT",
    path: "/api/equities/:id",
    input: { id: z.string(), name: z.string().optional(), value: z.number().optional(), cost: z.number().optional(), ticker: z.string().optional() },
  },
  { name: "delete_equity", title: "Excluir investimento", description: "Exclui um ativo de investimento.", method: "DELETE", path: "/api/equities/:id", input: { id: z.string() }, destructive: true },
  {
    name: "list_equity_valuations",
    title: "Histórico de avaliações",
    description: "Histórico de avaliações (valor ao longo do tempo) de um investimento.",
    method: "GET",
    path: "/api/equities/:id/valuations",
    input: { id: z.string() },
    readOnly: true,
  },
  {
    name: "add_equity_valuation",
    title: "Adicionar avaliação",
    description: "Registra uma nova avaliação de valor para um investimento.",
    method: "POST",
    path: "/api/equities/:id/valuations",
    input: { id: z.string(), value: z.number(), date: z.string().optional() },
  },
  {
    name: "investments_workspace",
    title: "Visão geral de investimentos",
    description: "Holdings, totais, alocação por tipo, fluxos dos últimos 6 meses e movimentações recentes.",
    method: "GET",
    path: "/api/investments/workspace",
    input: {},
    readOnly: true,
  },
];
