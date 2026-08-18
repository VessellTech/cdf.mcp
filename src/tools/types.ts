import type { ZodRawShape } from "zod";

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
   * Schema de input. Chaves que casam com ":nome" no path viram parâmetro de
   * rota; as demais viram query string (GET/DELETE) ou corpo JSON (POST/PUT).
   */
  input: ZodRawShape;
  /** Anotações de comportamento (MCP tool annotations). */
  readOnly?: boolean;
  destructive?: boolean;
}
