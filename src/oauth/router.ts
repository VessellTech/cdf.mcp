import { Router } from "express";
import { env } from "../config.js";
import { verifyPkce } from "./pkce.js";
import * as store from "./store.js";
import { createSession } from "../backend/session.js";
import { BackendApiError } from "../backend/client.js";

export const oauthRouter = Router();

/**
 * Authorization server "combinado": este serviço é ao mesmo tempo o
 * Authorization Server e o Resource Server do MCP. Não existe OAuth no
 * backend-husk (ele usa JWT próprio HS256 via /api/mobile/auth/login), então
 * em vez de proxear um AS externo, este servidor troca login/senha do app
 * por um token opaco do MCP — o par access/refresh do backend fica só aqui,
 * nunca é exposto ao client (Claude/ChatGPT).
 */

oauthRouter.get("/.well-known/oauth-authorization-server", (_req, res) => {
  res.json({
    issuer: env.PUBLIC_URL,
    authorization_endpoint: `${env.PUBLIC_URL}/authorize`,
    token_endpoint: `${env.PUBLIC_URL}/token`,
    registration_endpoint: `${env.PUBLIC_URL}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
});

oauthRouter.get("/.well-known/oauth-protected-resource", (_req, res) => {
  res.json({
    resource: `${env.PUBLIC_URL}/mcp`,
    authorization_servers: [env.PUBLIC_URL],
  });
});

oauthRouter.post("/register", async (req, res) => {
  const { client_name, redirect_uris } = req.body ?? {};
  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return res.status(400).json({ error: "invalid_client_metadata", error_description: "redirect_uris é obrigatório" });
  }
  const clientId = await store.registerClient(client_name, redirect_uris);
  res.status(201).json({
    client_id: clientId,
    client_name: client_name ?? null,
    redirect_uris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  });
});

oauthRouter.get("/authorize", async (req, res) => {
  const { response_type, client_id, redirect_uri, code_challenge, code_challenge_method, state } = req.query;

  if (response_type !== "code") return res.status(400).send("response_type deve ser 'code'");
  const client = typeof client_id === "string" ? await store.getClient(client_id) : null;
  if (!client) return res.status(400).send("client_id desconhecido — registre via /register");
  if (typeof redirect_uri !== "string" || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send("redirect_uri não registrado para este client");
  }
  if (typeof code_challenge !== "string" || code_challenge_method !== "S256") {
    return res.status(400).send("PKCE (S256) é obrigatório");
  }

  res.set("Content-Type", "text/html; charset=utf-8").send(renderLoginPage({
    clientId: client_id as string,
    clientName: client.clientName,
    redirectUri: redirect_uri,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    state: typeof state === "string" ? state : "",
    error: null,
  }));
});

oauthRouter.post("/authorize", async (req, res) => {
  const { email, password, client_id, redirect_uri, code_challenge, code_challenge_method, state } = req.body ?? {};

  const client = await store.getClient(client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send("requisição de autorização inválida");
  }

  try {
    const sessionId = await createSession(email, password);
    const code = await store.createAuthorizationCode({
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      sessionId,
    });
    const url = new URL(redirect_uri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);
    res.redirect(url.toString());
  } catch (err) {
    const invalidCreds = err instanceof BackendApiError && err.status === 401;
    res.status(invalidCreds ? 401 : 500).set("Content-Type", "text/html; charset=utf-8").send(renderLoginPage({
      clientId: client_id,
      clientName: client.clientName,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      state: state ?? "",
      error: invalidCreds ? "E-mail ou senha inválidos." : "Erro ao conectar com o Vessell. Tente novamente.",
    }));
  }
});

oauthRouter.post("/token", async (req, res) => {
  const { grant_type } = req.body ?? {};

  if (grant_type === "authorization_code") {
    const { code, code_verifier, redirect_uri, client_id } = req.body ?? {};
    const row = code ? await store.consumeAuthorizationCode(code) : null;
    if (!row || row.clientId !== client_id || row.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: "invalid_grant" });
    }
    if (!code_verifier || !verifyPkce(code_verifier, row.codeChallenge, row.codeChallengeMethod)) {
      return res.status(400).json({ error: "invalid_grant", error_description: "PKCE inválido" });
    }
    const tokens = await store.issueTokenPair(row.clientId, row.sessionId);
    return res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: "Bearer",
      expires_in: tokens.expiresIn,
    });
  }

  if (grant_type === "refresh_token") {
    const { refresh_token } = req.body ?? {};
    const tokens = refresh_token ? await store.rotateTokenPair(refresh_token) : null;
    if (!tokens) return res.status(400).json({ error: "invalid_grant" });
    return res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: "Bearer",
      expires_in: tokens.expiresIn,
    });
  }

  res.status(400).json({ error: "unsupported_grant_type" });
});

function renderLoginPage(p: {
  clientId: string;
  clientName: string | null | undefined;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  error: string | null;
}) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Conectar ao Vessell</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0d12;color:#eef;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
  form{background:#151823;padding:32px;border-radius:16px;width:320px}
  h1{font-size:18px;margin:0 0 4px}
  p.sub{color:#9aa;font-size:13px;margin:0 0 20px}
  label{display:block;font-size:13px;margin:14px 0 6px;color:#cdd}
  input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid #2a2e3d;background:#0f1119;color:#fff;font-size:14px}
  button{margin-top:20px;width:100%;padding:11px;border-radius:8px;border:none;background:#5b7cfa;color:#fff;font-weight:600;cursor:pointer}
  .err{color:#ff6b6b;font-size:13px;margin-top:12px}
</style></head>
<body>
<form method="post" action="/authorize">
  <h1>Conectar ao Vessell</h1>
  <p class="sub">${esc(p.clientName ?? "Um cliente MCP")} quer acessar seus dados financeiros.</p>
  <input type="hidden" name="client_id" value="${esc(p.clientId)}">
  <input type="hidden" name="redirect_uri" value="${esc(p.redirectUri)}">
  <input type="hidden" name="code_challenge" value="${esc(p.codeChallenge)}">
  <input type="hidden" name="code_challenge_method" value="${esc(p.codeChallengeMethod)}">
  <input type="hidden" name="state" value="${esc(p.state)}">
  <label for="email">E-mail</label>
  <input id="email" name="email" type="email" required autofocus>
  <label for="password">Senha</label>
  <input id="password" name="password" type="password" required>
  <button type="submit">Entrar</button>
  ${p.error ? `<div class="err">${esc(p.error)}</div>` : ""}
</form>
</body></html>`;
}
