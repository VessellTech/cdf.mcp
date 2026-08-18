import type { NextFunction, Request, Response } from "express";
import { env } from "../config.js";
import * as store from "./store.js";

declare module "express-serve-static-core" {
  interface Request {
    mcpSessionId?: string;
  }
}

/** Protege /mcp: exige Bearer <access_token do MCP> emitido por /token. */
export async function requireBearerAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    res
      .status(401)
      .set("WWW-Authenticate", `Bearer resource_metadata="${env.PUBLIC_URL}/.well-known/oauth-protected-resource"`)
      .json({ error: "unauthorized" });
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
