import { env } from "../config.js";

/**
 * Único ponto de contato com o backend-husk. Fala apenas HTTP público — o
 * mesmo contrato usado pelo app mobile (POST /api/mobile/auth/login,
 * refresh, e as rotas [autenticado] com Bearer <mobile JWT>). Isso é o que
 * garante isolamento: o mcp-server nunca importa código/schema do
 * backend-husk, então não há dependência circular possível entre os dois
 * serviços.
 */

export class BackendApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`backend-husk respondeu ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${env.BACKEND_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new BackendApiError(res.status, body);
  return body as T;
}

export interface LoginResult {
  user: Record<string, unknown>;
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface RefreshResult {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

/** device_id estável por sessão MCP — o backend usa isso para rotação/revogação de refresh token. */
export function mcpDeviceId(sessionId: string): string {
  return `mcp-${sessionId}`;
}

export function login(email: string, password: string, sessionId: string): Promise<LoginResult> {
  return request<LoginResult>("/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      device_id: mcpDeviceId(sessionId),
      platform: "mcp",
    }),
  });
}

export function refresh(refreshToken: string, sessionId: string): Promise<RefreshResult> {
  return request<RefreshResult>("/api/mobile/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refresh_token: refreshToken,
      device_id: mcpDeviceId(sessionId),
    }),
  });
}

/** Chamada genérica autenticada — usada pelo executor de tools (ver src/tools). */
export async function call<T>(
  accessToken: string,
  method: string,
  path: string,
  opts: { query?: Record<string, string | undefined>; body?: unknown } = {},
): Promise<T> {
  const url = new URL(`${env.BACKEND_API_URL}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new BackendApiError(res.status, body);
  return body as T;
}

/**
 * Registra a conexão de um cliente MCP (Claude, ChatGPT, ...) no backend-husk
 * — tabela "McpConnection", upsert por (userId, clientId). Chamado no token
 * exchange do OAuth; best-effort (falha não derruba a troca do code).
 */
export function recordMcpConnection(
  accessToken: string,
  params: { clientId: string; clientName: string; sessionId: string },
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/mobile/mcp/connection", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(params),
  });
}
