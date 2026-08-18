import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolDef } from "./types.js";
import { toolCatalog } from "./catalog/index.js";
import * as backend from "../backend/client.js";
import { getValidAccessToken } from "../backend/session.js";

const pathParamRegex = /:([A-Za-z0-9_]+)/g;

function buildPath(def: ToolDef, values: Record<string, unknown>): string {
  return def.path.replace(pathParamRegex, (_match, key: string) => {
    const v = values[key];
    if (v === undefined) throw new Error(`parâmetro de rota ausente: ${key}`);
    return encodeURIComponent(String(v));
  });
}

function pathParamNames(def: ToolDef): Set<string> {
  return new Set([...def.path.matchAll(pathParamRegex)].map((m) => m[1]));
}

/** Registra todos os tools do catálogo num McpServer, resolvendo o backend-husk via a sessão MCP autenticada. */
export function registerTools(server: McpServer, sessionId: string) {
  for (const def of toolCatalog) {
    const pathParams = pathParamNames(def);

    server.registerTool(
      def.name,
      {
        title: def.title,
        description: def.description,
        inputSchema: def.input,
        annotations: {
          readOnlyHint: def.readOnly ?? false,
          destructiveHint: def.destructive ?? false,
          idempotentHint: def.method === "PUT" || def.method === "DELETE",
          openWorldHint: false,
        },
      },
      async (args: Record<string, unknown>) => {
        try {
          const path = buildPath(def, args);
          const rest: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(args)) {
            if (!pathParams.has(k)) rest[k] = v;
          }

          const accessToken = await getValidAccessToken(sessionId);
          const isBodyMethod = def.method === "POST" || def.method === "PUT";

          const result = await backend.call(accessToken, def.method, path, {
            query: isBodyMethod
              ? undefined
              : (Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === undefined ? undefined : String(v)])) as Record<string, string>),
            body: isBodyMethod ? rest : undefined,
          });

          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          const message =
            err instanceof backend.BackendApiError
              ? `Erro ${err.status}: ${JSON.stringify(err.body)}`
              : err instanceof Error
                ? err.message
                : String(err);
          return { content: [{ type: "text" as const, text: message }], isError: true };
        }
      },
    );
  }
}

// Reexport para quem quiser inspecionar o catálogo (ex: geração de docs).
export { toolCatalog };
export type { ToolDef };
