import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "../tools/register.js";

/**
 * Modo stateless: cada requisição HTTP monta um McpServer + transport novos,
 * fechando ao final. Evita guardar estado de MCP em memória entre requests
 * (Railway pode rotear requisições da mesma conexão lógica para instâncias
 * diferentes) — a única coisa que precisa persistir entre chamadas é a
 * sessão OAuth (já é feito no Postgres, ver src/backend/session.ts).
 */
export async function handleMcpRequest(req: Request, res: Response) {
  const sessionId = req.mcpSessionId;
  if (!sessionId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const server = new McpServer({ name: "vessell-cdf", version: "0.1.0" });
  registerTools(server, sessionId);

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
