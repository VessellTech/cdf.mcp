import { z, type ZodRawShape } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ToolDef {
  /** Nome exposto ao client MCP (Claude/ChatGPT). */
  name: string;
  title: string;
  description: string;
  method: HttpMethod;
  /** Template de rota do backend-husk, ex: "/api/accounts/:id". */
  path: string;
  /**
   * Quando o path do backend depende do valor de um parâmetro (ex: uma tool
   * consolidada que escolhe entre duas rotas GET conforme um enum), sobrepõe
   * `path`. Recebe os args brutos da tool. Os campos usados aqui pra montar o
   * path continuam indo pro backend como query/body normalmente também.
   */
  resolvePath?: (values: Record<string, unknown>) => string;
  /**
   * Schema de input. Chaves que casam com ":nome" no path viram parâmetro de
   * rota; as demais viram query string (GET/DELETE) ou corpo JSON (POST/PUT).
   */
  input: ZodRawShape;
  /**
   * Schema de saída declarado (MCP outputSchema) — o modelo entende o formato
   * do resultado antes de chamar a tool. O SDK valida o retorno contra este
   * schema (todos os campos devem ser optional/nullable para nunca quebrar a
   * chamada) e exige objeto no topo: arrays devem vir embrulhados em
   * `{ data: [...] }`.
   */
  outputSchema?: z.ZodTypeAny;
  /** Anotações de comportamento (MCP tool annotations). */
  readOnly?: boolean;
  destructive?: boolean;
  /**
   * Chaves de topo a remover da resposta do backend antes de devolver ao
   * cliente MCP (ex: campos sensíveis que a rota original do app precisa
   * mas que a tool não deveria expor pro modelo, mesmo que o outputSchema
   * já não os declare — o outputSchema não filtra o texto/JSON bruto).
   */
  redactFields?: string[];
}
