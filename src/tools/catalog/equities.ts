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
    description:
      "Lista os ativos de investimento (equities) do usuário, ordenados do mais recente para o mais antigo (createdAt desc). Cada item traz o valor/custo atuais (o mais recente registrado, seja por update_equity ou add_equity_valuation), não o histórico — para histórico de um ativo específico use list_equity_valuations, e para visão consolidada (totais, alocação, ganhos) use investments_workspace.",
    method: "GET",
    path: "/api/equities",
    input: {},
    outputSchema: z.object({ data: z.array(equitySchema) }),
    readOnly: true,
  },
  {
    name: "create_equity",
    title: "Criar investimento",
    description:
      "Cria um ativo de investimento (Equity) e, no mesmo statement atômico, registra sua primeira avaliação (EquityValuation) com value/cost/data informados — equivalente a criar o ativo e já chamar add_equity_valuation uma vez. Dispara recálculo best-effort de projeções e insights em background.",
    method: "POST",
    path: "/api/equities",
    input: {
      name: z.string().describe("Nome do investimento"),
      type: z.string().describe("Tipo do ativo — ex: stocks, crypto, real-estate-house, real-estate-apt, vehicle-car, business, cash, jewelry, art. Usado para agrupar a alocação em investments_workspace"),
      ticker: z.string().optional().describe("Código do ativo na bolsa/exchange (ex: PETR4). Convertido para maiúsculas"),
      exchange: z.string().optional().describe("Bolsa/exchange onde o ativo é negociado"),
      value: z.number().describe("Valor de mercado atual do investimento"),
      cost: z.number().optional().describe("Custo/valor investido. Default: igual a value (sem ganho/perda registrado se omitido)"),
      acquisitionDate: z.string().optional().describe("Data de aquisição (ISO). Default: agora"),
      description: z.string().optional().describe("Descrição livre do investimento"),
      color: z.string().optional().describe("Cor associada ao investimento na UI (ex: hex '#RRGGBB')"),
      shares: z.number().optional().describe("Quantidade de cotas/ações compradas, se aplicável"),
    },
    outputSchema: equitySchema,
  },
  {
    name: "update_equity",
    title: "Atualizar investimento",
    description:
      "Atualiza campos de um investimento existente (`id` = id do investimento). Campos omitidos mantêm o valor atual — exceto description/ticker/exchange/shares, que quando enviados como string vazia são limpos (setados para null). Se value e/ou cost forem enviados, registra automaticamente uma nova avaliação (EquityValuation) datada de agora com os valores resultantes — equivalente a um add_equity_valuation implícito sem data retroativa. Para registrar um valor histórico numa data específica sem alterar os outros campos do investimento, use add_equity_valuation em vez desta.",
    method: "PUT",
    path: "/api/equities/:id",
    input: {
      id: z.string().describe("Id do investimento (Equity) a atualizar"),
      name: z.string().optional().describe("Novo nome"),
      type: z.string().optional().describe("Novo tipo do ativo — ex: stocks, crypto, real-estate-house"),
      value: z.number().optional().describe("Novo valor de mercado — se informado, registra nova avaliação"),
      cost: z.number().optional().describe("Novo custo/valor investido — se informado, registra nova avaliação"),
      ticker: z.string().optional().describe("Novo código do ativo na bolsa; string vazia remove o ticker"),
      exchange: z.string().optional().describe("Nova bolsa/exchange; string vazia remove"),
      acquisitionDate: z.string().optional().describe("Nova data de aquisição (ISO)"),
      description: z.string().optional().describe("Nova descrição; string vazia limpa o campo"),
      color: z.string().optional().describe("Nova cor associada na UI"),
      shares: z.number().optional().describe("Nova quantidade de cotas/ações"),
    },
    outputSchema: equitySchema,
  },
  {
    name: "delete_equity",
    title: "Excluir investimento",
    description:
      "Exclui permanentemente um ativo de investimento do usuário dono (`id` = id do investimento). Não afeta transações já lançadas ligadas a ele (equityId fica órfão); o histórico de avaliações (EquityValuation) é removido junto via cascade do banco. `count` retorna 0 se o id não existir ou não pertencer ao usuário (sem erro).",
    method: "DELETE",
    path: "/api/equities/:id",
    input: { id: z.string().describe("Id do investimento a excluir") },
    outputSchema: z.object({ count: z.number().optional() }),
    destructive: true,
  },
  {
    name: "list_equity_valuations",
    title: "Histórico de avaliações",
    description:
      "Histórico completo de avaliações (EquityValuation: value/cost ao longo do tempo) de um investimento (`id` = id do investimento, não da avaliação), ordenado do mais recente para o mais antigo (asOf desc). Não filtra por período nem pagina.",
    method: "GET",
    path: "/api/equities/:id/valuations",
    input: { id: z.string().describe("Id do investimento (Equity), não da avaliação") },
    outputSchema: z.object({ data: z.array(equityValuationSchema) }),
    readOnly: true,
  },
  {
    name: "add_equity_valuation",
    title: "Adicionar avaliação",
    description:
      "Adiciona um ponto no histórico de valor de um investimento (`id` = id do investimento/equity, não da avaliação). Sempre insere uma nova linha, mesmo se já houver avaliação na mesma data — não sobrescreve nem deduplica. `date` é opcional (default agora); use pra registrar uma avaliação retroativa. Efeito colateral: o `value`/`cost` do investimento em si também é atualizado para os valores desta avaliação, então ela passa a ser o valor 'atual' retornado por list_equities. Diferença de update_equity: use esta ferramenta pra registrar histórico com data específica sem tocar em outros campos do investimento (nome, ticker etc.); use update_equity quando quiser editar o investimento e deixar o valor atualizado datado de hoje.",
    method: "POST",
    path: "/api/equities/:id/valuations",
    input: {
      id: z.string().describe("Id do investimento (Equity), não da avaliação"),
      value: z.number().describe("Novo valor de mercado do investimento"),
      date: z.string().optional().describe("Data da avaliação (ISO). Default: agora. Use pra backfill retroativo"),
      cost: z.number().optional().describe("Custo/valor investido nesta data. Default: igual a value (sem ganho/perda registrado se omitido)"),
    },
    outputSchema: equityValuationSchema,
  },
  {
    name: "investments_workspace",
    title: "Visão geral de investimentos",
    description:
      "Visão consolidada de investimentos: lista de equities, holdings com ganho/perda (valor atual vs custo, usando a avaliação mais recente de cada ativo), totais agregados, alocação por tipo (agrupada em categorias como Imóveis/Veículos/Investimentos/Liquidez/Bens Pessoais/Outros), fluxo mensal dos últimos 6 meses (contributions = despesas ligadas a investimento, withdrawals = receitas ligadas a investimento) e as 6 movimentações mais recentes. Um só request para o que list_equities + list_equity_valuations exigiriam montar manualmente — use este para dashboard/resumo, e list_equities/list_equity_valuations quando precisar só dos dados crus de um ativo.",
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
