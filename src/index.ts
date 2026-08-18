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

app.use(oauthRouter);

app.all("/mcp", requireBearerAuth, (req, res) => {
  handleMcpRequest(req, res).catch((err) => {
    console.error("erro no /mcp:", err);
    if (!res.headersSent) res.status(500).json({ error: "internal_error" });
  });
});

app.listen(env.PORT, () => {
  console.log(`cdf-mcp-server ouvindo em :${env.PORT} (público: ${env.PUBLIC_URL})`);
  console.log(`backend-husk: ${env.BACKEND_API_URL}`);
});
