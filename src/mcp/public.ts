/**
 * Métodos MCP que podem ser chamados sem token: servem para o cliente (ou um
 * agente escolhendo servidor) ver o que o CDF Finance faz antes de fazer login.
 * Nenhum deles toca dados do usuário — `tools/list` só devolve o catálogo
 * público de definições. Qualquer outro método (`tools/call`, etc.) exige Bearer.
 */
const PUBLIC_MCP_METHODS = new Set([
  "initialize",
  "notifications/initialized",
  "ping",
  "tools/list",
]);

/**
 * True quando o corpo JSON-RPC (mensagem única ou batch) contém apenas
 * métodos públicos. Um único método protegido no batch torna tudo protegido.
 */
export function isPublicMcpPayload(body: unknown): boolean {
  const messages: unknown[] = Array.isArray(body) ? body : [body];
  if (messages.length === 0) return false;
  return messages.every((msg) => {
    if (!msg || typeof msg !== "object") return false;
    const method = (msg as { method?: unknown }).method;
    return typeof method === "string" && PUBLIC_MCP_METHODS.has(method);
  });
}
