import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolDef } from "./types.js";
import { toolCatalog } from "./catalog/index.js";
import { env } from "../config.js";
import * as backend from "../backend/client.js";

const pathParamRegex = /:([A-Za-z0-9_]+)/g;

const DATA_URI_RE = /^data:[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+;base64,/;
const MAX_STRING_LEN = 4000;

/**
 * Alguns campos do backend-husk guardam imagem inline como data URL base64
 * (ex: User.picture) em vez de uma URL — ótimo pro app mobile, péssimo pra um
 * cliente MCP: já vimos um payload de 1.4MB estourar o contexto do Claude.
 * Troca qualquer data URI (e qualquer string absurdamente longa, de forma
 * genérica) por um placeholder antes de devolver ao cliente.
 */
function redactLargeInlineData(value: unknown): unknown {
  if (typeof value === "string") {
    if (DATA_URI_RE.test(value)) {
      const kb = Math.round((value.length * 0.75) / 1024);
      return `[imagem omitida — ~${kb} KB, use o app pra visualizar]`;
    }
    if (value.length > MAX_STRING_LEN) {
      return `${value.slice(0, 200)}… [truncado — ${value.length} caracteres no total]`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redactLargeInlineData);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactLargeInlineData(v)]));
  }
  return value;
}

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

/**
 * Registra todos os tools do catálogo num McpServer.
 *
 * O token do backend-husk vem de um resolvedor: no modo OAuth, a sessão MCP
 * autenticada (renovando via refresh quando necessário); no modo
 * serviço-a-serviço, o JWT mobile passado em X-CDF-User-Token pelo
 * backend-husk (o dono do JWT já foi validado pelo backend antes de chamar).
 */
export function registerTools(server: McpServer, resolveToken: () => Promise<string>) {
  // Em MCP_TOOLS_MODE=readonly (ex: listagem em diretórios curados), expõe só
  // consultas — oculta criação/edição/exclusão do catálogo.
  const catalog =
    env.MCP_TOOLS_MODE === "readonly" ? toolCatalog.filter((t) => t.readOnly) : toolCatalog;

  for (const def of catalog) {
    const pathParams = pathParamNames(def);

    server.registerTool(
      def.name,
      {
        title: def.title,
        description: def.description,
        inputSchema: def.input,
        outputSchema: def.outputSchema,
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

          const accessToken = await resolveToken();
          const isBodyMethod = def.method === "POST" || def.method === "PUT";

          const result = await backend.call(accessToken, def.method, path, {
            query: isBodyMethod
              ? undefined
              : (Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === undefined ? undefined : String(v)])) as Record<string, string>),
            body: isBodyMethod ? rest : undefined,
          });

          const sanitized = redactLargeInlineData(result);
          // O SDK valida structuredContent contra o outputSchema (objeto).
          // Arrays no topo vêm embrulhados em { data } — texto e structured
          // ficam consistentes.
          const structured = Array.isArray(sanitized)
            ? { data: sanitized }
            : (sanitized as Record<string, unknown>);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(structured, null, 2) }],
            structuredContent: structured,
          };
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
