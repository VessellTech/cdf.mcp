import express from "express";
import { env, allowedOrigins } from "./config.js";
import { oauthRouter } from "./oauth/router.js";
import { requireBearerAuth } from "./oauth/middleware.js";
import { handleMcpRequest } from "./mcp/http.js";

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  const origin = req.header("origin");
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version");
    res.set("Access-Control-Expose-Headers", "Mcp-Session-Id");
    res.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.urlencoded({ extended: false })); // form POST /authorize
app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/.well-known/openai-apps-challenge", (_req, res) => {
  const token = env.OPENAI_APPS_CHALLENGE_TOKEN;
  if (!token) {
    res.status(503).type("text/plain; charset=utf-8").send("OPENAI_APPS_CHALLENGE_TOKEN not configured");
    return;
  }
  res.type("text/plain; charset=utf-8").send(token);
});

app.use(oauthRouter);

function mcpEndpoint(req: express.Request, res: express.Response) {
  handleMcpRequest(req, res).catch((err) => {
    console.error(`erro no ${req.path}:`, err);
    if (!res.headersSent) res.status(500).json({ error: "internal_error" });
  });
}

// Alguns clients MCP (Claude entre eles) tratam a URL do conector como o
// próprio endpoint de transporte e ignoram o "resource" descoberto via
// .well-known — então respondem tanto na raiz quanto em /mcp evita depender
// de o usuário digitar o sufixo certo.
app.all("/mcp", requireBearerAuth, mcpEndpoint);
app.all("/", requireBearerAuth, mcpEndpoint);

app.listen(env.PORT, () => {
  console.log(`cdf-mcp-server ouvindo em :${env.PORT} (público: ${env.PUBLIC_URL})`);
  console.log(`backend-husk: ${env.BACKEND_API_URL}`);
});
