import type { NextFunction, Request, Response } from "express";
import { env } from "../config.js";
import * as store from "./store.js";
import { isPublicMcpPayload } from "../mcp/public.js";

declare module "express-serve-static-core" {
  interface Request {
    mcpSessionId?: string;
    /** Só no modo serviço-a-serviço: JWT mobile do usuário (backend-husk → MCP). */
    mcpUserToken?: string;
    /** Requisição sem token com apenas métodos públicos (initialize, tools/list…). */
    mcpAnonymous?: boolean;
  }
}

/**
 * Protege /mcp: exige Bearer <access_token do MCP> emitido por /token, exceto
 * para métodos públicos (initialize, tools/list, ping) enviados sem nenhum
 * header Authorization — assim clientes e agentes conseguem descobrir o
 * catálogo antes de logar. Um Bearer presente é sempre validado, mesmo nesses
 * métodos. `tools/call` e demais métodos continuam exigindo token.
 *
 * Modo serviço-a-serviço (backend-husk → MCP): quando `MCP_SERVICE_TOKEN` está
 * configurado e o Bearer é exatamente esse token, a sessão é resolvida para o
 * JWT mobile do usuário enviado em `X-CDF-User-Token` (o backend-husk já o
 * validou ao receber a request do app). Nesse modo não há sessão OAuth: o
 * executor de tools usa o token fornecido direto, em vez de resolver a sessão.
 */
export async function requireBearerAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (header === undefined && req.method === "POST" && isPublicMcpPayload(req.body)) {
    req.mcpAnonymous = true;
    next();
    return;
  }

  const [scheme, token] = (header ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    res
      .status(401)
      .set("WWW-Authenticate", `Bearer resource_metadata="${env.PUBLIC_URL}/.well-known/oauth-protected-resource"`)
      .json({ error: "unauthorized" });
    return;
  }

  if (env.MCP_SERVICE_TOKEN && token === env.MCP_SERVICE_TOKEN) {
    const userToken = req.header("x-cdf-user-token");
    if (!userToken) {
      res.status(401).json({ error: "missing_x_cdf_user_token" });
      return;
    }
    req.mcpUserToken = userToken;
    req.mcpSessionId = "service";
    next();
    return;
  }

  const resolved = await store.resolveAccessToken(token);
  if (!resolved) {
    res
      .status(401)
      .set("WWW-Authenticate", `Bearer resource_metadata="${env.PUBLIC_URL}/.well-known/oauth-protected-resource"`)
      .json({ error: "invalid_token" });
    return;
  }

  req.mcpSessionId = resolved.sessionId;
  next();
}
