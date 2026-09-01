# CDF Finance MCP

> Conecte Claude, ChatGPT e qualquer client MCP (OAuth 2.1) à sua conta CDF Finance — consulte e registre sua vida financeira por linguagem natural.

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](./LICENSE)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-io.github.VessellTech%2Fcdf.mcp-black)](./server.json)
[![Version](https://img.shields.io/badge/version-0.1.7-informational)](./package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)](./package.json)

**Remoto:** `https://mcp.cdf.finance/mcp` (Streamable HTTP) · **Website:** <https://cdf.finance/mcp> · **Status:** <https://status.cdf.finance> · **Suporte:** `support@cdf.finance`

---

## O que é

MCP server **stateless** e isolado para o [CDF Finance](https://cdf.finance) — app de controle financeiro pessoal (contas, cartões, transações, faturas, orçamentos, metas, dívidas, investimentos e insights).

- **Para usuários:** pergunte ao Claude/ChatGPT sobre seu dinheiro e registre lançamentos sem abrir o app.
- **Para desenvolvedores/revisores:** código auditável, sem dependência do `backend-husk` — só HTTP sobre a API pública que o app mobile já usa.

> **Source-available** sob [BUSL-1.1](./LICENSE): pode auditar, usar com o CDF Finance, contribuir. Uso em produção como produto concorrente exige licença comercial. Vira `Apache-2.0` em `2030-09-01`.

### Exemplos

| Você diz | O que acontece |
|---|---|
| "Quanto sobrou do meu salário esse mês?" | `current_month_spending` + `categories_insights` |
| "Minha próxima fatura vai caber no orçamento?" | `list_pending_invoices` + `budget_comparison` |
| "Lança um Uber de R$ 27,50 no Nubank como Transporte" | `list_accounts` + `list_categories` + `create_transaction` |

English: *"How much is left of my salary?" / "Will my next bill fit the budget?" / "Log an Uber ride of R$27.50 on Nubank as Transportation."*

---

## Arquitetura

Isolamento total do `backend-husk` — este serviço **não importa código do backend**.

```
Claude / ChatGPT (MCP client)
        │  OAuth 2.1 — DCR + PKCE (S256)
        ▼
┌───────────────────────────────┐
│  cdf-mcp-server (este repo)   │  Postgres isolado (Railway)
│  • Authorization Server        │  ├─ oauth_clients / oauth_codes
│  • Resource Server (/mcp)     │  ├─ oauth_tokens (hash SHA-256)
│  • Catálogo declarativo       │  └─ sessions (JWT mobile criptografado
│    ~50 tools → REST           │                AES-256-GCM)
└───────────────┬───────────────┘
                │  HTTPS — Bearer <mobile JWT>
                ▼
        backend-husk (api.vessell.app)
        API pública — mesmo contrato do app mobile
```

**Fluxo de login:**

1. Client faz Dynamic Client Registration em `/register`.
2. Usuário autoriza em `/authorize` (form server-rendered, sem terceiros) → `POST /api/mobile/auth/login` com `device_id=mcp-<sessionId>`, `platform=mcp`.
3. `access/refresh` do backend ficam **criptografados** em `sessions`; client MCP recebe apenas token opaco (`oauth_tokens`).
4. Cada tool renova o `access_token` via `refresh` automaticamente (`getValidAccessToken`).
5. Sessão aparece como device em `GET /api/mobile/devices` — revogável em `DELETE /api/mobile/devices/:id`.

Por que isolado (`README` original): sem dependência circular, deploy/escala independentes (Railway vs Coolify no backend) e imune a troca de linguagem do backend — só fala HTTP.

## Tools

Catálogo 100% declarativo em [`src/tools/catalog/`](./src/tools/catalog/) — cada tool é `{ name, method, path, input(zod) }` executada por [`src/tools/register.ts`](./src/tools/register.ts). Nova rota no backend = nova entrada, sem handler.

| Domínio | Tools (exemplos) |
|---|---|
| **User** | `get_profile`, `update_profile` |
| **Accounts / Cards** | `list_accounts`, `create_account`, `list_cards`, `current_invoice` |
| **Categories / Cost Centers** | `list_categories`, `create_category`, `list_cost_centers` |
| **Transactions** | `list_transactions`, `create_transaction`, `confirm_pending_transaction`, `upcoming_transactions` |
| **Recurring / Invoices** | `list_recurring_transactions`, `list_invoices`, `pay_invoice` |
| **Goals / Budgets / Debts** | `list_goals`, `budget_comparison`, `create_debt`, `debt_payoff_simulation` |
| **Equities / Investments** | `list_equities`, `add_equity_valuation`, `investments_workspace` |
| **Insights / Analytics** | `cashflow_forecast`, `spending_projection`, `networth_projection`, `categories_insights`, `behavior_insights`, `can_afford`, `analytics_history` |
| **Tags** | `list_tags`, `create_tag` |

Fora de escopo de propósito (igual ao backend): `admin`, `Stripe/pagamentos`, `webhooks`, `S3/anexos`, `/api/ai/*`.

> **Modo somente leitura:** `MCP_TOOLS_MODE=readonly` expõe só `readOnly:true` — ideal para diretórios curados.

---

## Quick start

```bash
cp .env.example .env   # preencha DATABASE_URL, TOKEN_ENCRYPTION_KEY, SESSION_SECRET
npm install
npm run db:migrate
npm run dev            # http://localhost:8090
```

Teste com MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP → http://localhost:8090/mcp
```

### Variáveis de ambiente

| Var | Obrigatória | Descrição |
|---|---|---|
| `PUBLIC_URL` | sim | URL pública deste serviço (entra nos metadados OAuth). Gere o domínio **antes** do primeiro deploy |
| `PORT` | não | default `8090` |
| `BACKEND_API_URL` | sim | `https://api.vessell.app` (ou staging) |
| `DATABASE_URL` | sim | Postgres isolado deste serviço |
| `TOKEN_ENCRYPTION_KEY` | sim | 32 bytes base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `SESSION_SECRET` | sim | string longa aleatória p/ cookies `/authorize` |
| `MCP_SERVICE_TOKEN` | não | segredo serviço-a-serviço (`backend-husk → MCP` via `X-CDF-User-Token`). Se ausente, só OAuth |
| `MCP_TOOLS_MODE` | não | `full` (default) ou `readonly` |
| `OPENAI_APPS_CHALLENGE_TOKEN` | não | verificação de domínio OpenAI |
| `ALLOWED_ORIGINS` | não | CORS do `/authorize` — default `https://claude.ai,https://chatgpt.com` |

Ver [`.env.example`](./.env.example) comentado.

## Deploy (Railway)

1. `railway init` ou conecte o repo no dashboard.
2. Adicione addon **Postgres** (injeta `DATABASE_URL`).
3. Configure envs acima — gere domínio em **Settings → Networking** primeiro.
4. Deploy: `Dockerfile` → `node dist/index.js` (`railway.json` já configurado).
5. Migration: `railway run npm run db:migrate`.
6. No Claude.ai/ChatGPT aponte o connector para `https://<seu-dominio>.up.railway.app/mcp` — DCR/OAuth é automático.

---

## Segurança

- **PKCE S256 obrigatório** em todo `authorization_code`.
- **Tokens opacos** — só `SHA-256` persiste (`oauth_tokens`), bruto é entregue uma vez.
- **JWT mobile criptografado** `AES-256-GCM` em `sessions` — nunca exposto ao client (`src/crypto.ts`, `src/mcp/http.ts`).
- **Device isolado** — cada sessão `mcp-<id>` (`src/backend/client.ts:45`) revogável sem afetar outros logins.
- **Sanitização** — `redactLargeInlineData` + `redactFields` (`src/tools/register.ts:19`) evita vazamento de `data:` URI e campos sensíveis pro LLM.

Reporte vulnerabilidades em [`SECURITY.md`](./SECURITY.md) — **não abra issue pública**: `support@cdf.finance` `[SECURITY]`.

## Conformidade — Diretório Anthropic (Seção 4.A)

Este conector **não transfere dinheiro/cripto/ativos e não executa pagamentos em nome do usuário** — apenas lê e registra lançamentos no controle financeiro pessoal, igual ao app. Toda escrita é explícita e solicitada na conversa.

- Para listagens curadas use `MCP_TOOLS_MODE=readonly`.
- Pedido de exceção por escrito (previsto na própria 4.A): [`docs/4a-exception-request.md`](./docs/4a-exception-request.md).
- **Conta de teste para revisores:** `joao@teste.com` / `123456` (dados de amostra).

## Contribuindo

Veja [`CONTRIBUTING.md`](./CONTRIBUTING.md) — fork, branch `feat/...`, `npm run build` e PR com path validado no backend. Ao contribuir você licencia sob `BUSL-1.1`.

## Licença

Source-available **[BUSL-1.1](./LICENSE)** — uso com o CDF Finance, pessoal, acadêmico e contribuições são livres. **Proibido** uso em produção como produto concorrente de gestão financeira (hosted/managed). Converte para `Apache-2.0` em `2030-09-01`.

Dúvidas comerciais: `support@cdf.finance`.

---

<p align="center">
  <sub>Construído com <a href="https://modelcontextprotocol.io">Model Context Protocol</a> · Mantido por <a href="https://cdf.finance">Vessell CDF Finance</a></sub>
</p>
