# CDF Finance MCP

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](./LICENSE)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-io.github.VessellTech%2Fcdf.mcp-black)](./server.json)
[![mcptry](https://mcptry.com/badge/io.github.VessellTech/cdf.mcp)](https://mcptry.com/servers/io.github.VessellTech/cdf.mcp)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)](./package.json)

> Connect Claude, ChatGPT, or any MCP client (OAuth 2.1) to your CDF Finance account — ask about and log your personal finances in natural language.
>
> Conecte Claude, ChatGPT ou qualquer cliente MCP (OAuth 2.1) à sua conta CDF Finance — consulte e registre suas finanças pessoais em linguagem natural.

**Remote endpoint / Endpoint remoto:** `https://mcp.cdf.finance/mcp` (Streamable HTTP) · **Website:** <https://cdf.finance> · **Status:** <https://status.cdf.finance> · **Support / Suporte:** `support@cdf.finance`

**Language / Idioma:** [Português](#português) · [English](#english)

---

## Português

### O que é

Servidor MCP remoto e stateless do [CDF Finance](https://cdf.finance), app de controle financeiro pessoal (contas, cartões, transações, faturas, orçamentos, metas, dívidas, investimentos e insights).

- **Para usuários:** pergunte ao Claude ou ao ChatGPT sobre seu dinheiro e registre lançamentos sem abrir o app.
- **Para desenvolvedores e revisores:** código auditável, que fala apenas HTTP com a API pública do CDF Finance.

> **Source-available** sob [BUSL-1.1](./LICENSE): você pode auditar, usar com o CDF Finance e contribuir. Uso em produção como produto concorrente exige licença comercial. Converte para `Apache-2.0` em `2030-09-01`.

### Exemplos

| Você pergunta | O que acontece |
|---|---|
| "Quanto sobrou do meu salário esse mês?" | `current_month_spending` + `categories_insights` |
| "Minha próxima fatura vai caber no orçamento?" | `list_pending_invoices` + `budget_comparison` |
| "Lança um Uber de R$ 27,50 no Nubank como Transporte" | `list_accounts` + `list_categories` + `create_transaction` |

### Como funciona

```
Claude / ChatGPT (cliente MCP)
        │  OAuth 2.1 — DCR + PKCE (S256)
        ▼
┌─────────────────────────────┐
│  CDF Finance MCP            │
│  • Servidor de autorização  │
│  • Servidor de recursos     │  →  API pública do CDF Finance
│    (/mcp)                   │
│  • ~50 tools declarativas   │
└─────────────────────────────┘
```

**Fluxo de login:**

1. O cliente se registra automaticamente (Dynamic Client Registration).
2. Você autoriza em uma página de login do próprio CDF Finance, sem terceiros.
3. O cliente recebe apenas um token opaco. As credenciais da sua conta ficam criptografadas no servidor.
4. O token de acesso é renovado automaticamente.
5. A sessão aparece nos dispositivos conectados da sua conta, onde pode ser revogada a qualquer momento.

**Descoberta sem login:** `initialize`, `ping` e `tools/list` respondem sem token, então você (ou um agente) pode ver o catálogo de ferramentas antes de conectar. `tools/call` e os demais métodos exigem login; sem ele, a resposta é `401` com `WWW-Authenticate`, o que inicia o fluxo OAuth.

### Ferramentas

O catálogo é declarativo, em [`src/tools/catalog/`](./src/tools/catalog/).

| Domínio | Ferramentas (exemplos) |
|---|---|
| **Usuário** | `get_profile`, `update_profile` |
| **Contas / Cartões** | `list_accounts`, `create_account`, `list_cards`, `current_invoice` |
| **Categorias / Centros de custo** | `list_categories`, `create_category`, `list_cost_centers` |
| **Transações** | `list_transactions`, `create_transaction`, `confirm_pending_transaction`, `upcoming_transactions` |
| **Recorrências / Faturas** | `list_recurring_transactions`, `list_invoices`, `pay_invoice` |
| **Metas / Orçamentos / Dívidas** | `list_goals`, `budget_comparison`, `create_debt`, `debt_payoff_simulation` |
| **Investimentos** | `list_equities`, `add_equity_valuation`, `investments_workspace` |
| **Insights** | `cashflow_forecast`, `spending_projection`, `networth_projection`, `categories_insights`, `behavior_insights`, `can_afford`, `analytics_history` |
| **Tags** | `list_tags`, `create_tag` |

Fora do escopo deste conector: administração, pagamentos, webhooks e anexos.

> **Modo somente leitura:** `MCP_TOOLS_MODE=readonly` expõe apenas as ferramentas de consulta.

---

## Início rápido

```bash
cp .env.example .env   # preencha DATABASE_URL, TOKEN_ENCRYPTION_KEY e SESSION_SECRET
npm install
npm run db:migrate
npm run dev            # http://localhost:8090
```

Teste com o MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP → http://localhost:8090/mcp
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PUBLIC_URL` | sim | URL pública deste serviço (usada nos metadados OAuth). Defina antes do primeiro deploy |
| `PORT` | não | Padrão `8090` |
| `BACKEND_API_URL` | sim | URL da API do CDF Finance |
| `DATABASE_URL` | sim | Banco Postgres dedicado a este serviço |
| `TOKEN_ENCRYPTION_KEY` | sim | 32 bytes em base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `SESSION_SECRET` | sim | String longa e aleatória para os cookies de autorização |
| `MCP_SERVICE_TOKEN` | não | Segredo entre serviços internos. Se ausente, só OAuth |
| `MCP_TOOLS_MODE` | não | `full` (padrão) ou `readonly` |
| `OPENAI_APPS_CHALLENGE_TOKEN` | não | Verificação de domínio da OpenAI |
| `ALLOWED_ORIGINS` | não | Origens permitidas no CORS de `/authorize`. Padrão: `https://claude.ai,https://chatgpt.com` |

Veja [`.env.example`](./.env.example) comentado.

### Deploy

1. Crie o serviço em qualquer host que rode Node 20+ (o [`Dockerfile`](./Dockerfile) está incluído).
2. Provisione um banco Postgres e injete `DATABASE_URL`.
3. Configure as variáveis acima. Gere o domínio público **antes** do primeiro deploy, pois ele vai em `PUBLIC_URL`.
4. Inicie com `node dist/index.js`.
5. Rode a migração: `npm run db:migrate`.
6. No Claude.ai ou ChatGPT, aponte o conector para `https://<seu-dominio>/mcp`. O OAuth é automático.

---

## Segurança

- **PKCE S256 obrigatório** em todo `authorization_code`.
- **Métodos públicos sem token:** apenas `initialize`, `ping`, `notifications/initialized` e `tools/list` ([`src/mcp/public.ts`](./src/mcp/public.ts)). Nenhum deles acessa dados do usuário.
- **Tokens opacos:** o servidor guarda só o hash dos tokens; o valor bruto é entregue uma única vez.
- **Credenciais criptografadas em repouso** (AES-256-GCM).
- **Sanitização de respostas:** imagens inline e campos sensíveis são removidos antes de chegar ao modelo.

Reporte vulnerabilidades em [`SECURITY.md`](./SECURITY.md). **Não abra issue pública**: escreva para `support@cdf.finance` com o assunto `[SECURITY]`.

## Contribuindo

Veja [`CONTRIBUTING.md`](./CONTRIBUTING.md). Ao contribuir, você licencia sua contribuição sob `BUSL-1.1`.

## Licença

Source-available sob **[BUSL-1.1](./LICENSE)**. Uso com o CDF Finance, uso pessoal, acadêmico e contribuições são livres. **Proibido** uso em produção como produto concorrente de gestão financeira (hospedado ou gerenciado). Converte para `Apache-2.0` em `2030-09-01`.

Dúvidas comerciais: `support@cdf.finance`.

---

## English

### What it is

A stateless, remote MCP server for [CDF Finance](https://cdf.finance), a personal finance app (accounts, cards, transactions, invoices, budgets, goals, debts, investments and insights).

- **For users:** ask Claude or ChatGPT about your money and log transactions without opening the app.
- **For developers and reviewers:** auditable code that talks only HTTP to CDF Finance's public API.

> **Source-available** under [BUSL-1.1](./LICENSE): you may audit it, use it with CDF Finance, and contribute. Production use as a competing product requires a commercial license. Converts to `Apache-2.0` on `2030-09-01`.

### Examples

| You ask | What happens |
|---|---|
| "How much is left of my salary this month?" | `current_month_spending` + `categories_insights` |
| "Will my next bill fit the budget?" | `list_pending_invoices` + `budget_comparison` |
| "Log an Uber ride of R$27.50 on Nubank as Transportation" | `list_accounts` + `list_categories` + `create_transaction` |

### How it works

```
Claude / ChatGPT (MCP client)
        │  OAuth 2.1 — DCR + PKCE (S256)
        ▼
┌─────────────────────────────┐
│  CDF Finance MCP            │
│  • Authorization server     │
│  • Resource server (/mcp)   │  →  CDF Finance public API
│  • ~50 declarative tools    │
└─────────────────────────────┘
```

**Sign-in flow:**

1. The client registers itself automatically (Dynamic Client Registration).
2. You authorize on a CDF Finance sign-in page, with no third parties involved.
3. The client receives only an opaque token. Your account credentials stay encrypted on the server.
4. The access token is renewed automatically.
5. The session appears among your connected devices, where you can revoke it at any time.

**Discovery without sign-in:** `initialize`, `ping` and `tools/list` respond without a token, so you (or an agent) can see the tool catalog before connecting. `tools/call` and all other methods require sign-in; without it the server returns `401` with `WWW-Authenticate`, which starts the OAuth flow.

### Tools

The catalog is declarative, in [`src/tools/catalog/`](./src/tools/catalog/).

| Area | Tools (examples) |
|---|---|
| **User** | `get_profile`, `update_profile` |
| **Accounts / Cards** | `list_accounts`, `create_account`, `list_cards`, `current_invoice` |
| **Categories / Cost centers** | `list_categories`, `create_category`, `list_cost_centers` |
| **Transactions** | `list_transactions`, `create_transaction`, `confirm_pending_transaction`, `upcoming_transactions` |
| **Recurring / Invoices** | `list_recurring_transactions`, `list_invoices`, `pay_invoice` |
| **Goals / Budgets / Debts** | `list_goals`, `budget_comparison`, `create_debt`, `debt_payoff_simulation` |
| **Investments** | `list_equities`, `add_equity_valuation`, `investments_workspace` |
| **Insights** | `cashflow_forecast`, `spending_projection`, `networth_projection`, `categories_insights`, `behavior_insights`, `can_afford`, `analytics_history` |
| **Tags** | `list_tags`, `create_tag` |

Out of scope for this connector: administration, payments, webhooks and attachments.

> **Read-only mode:** `MCP_TOOLS_MODE=readonly` exposes only the read tools.

---

## Quick start

```bash
cp .env.example .env   # fill in DATABASE_URL, TOKEN_ENCRYPTION_KEY and SESSION_SECRET
npm install
npm run db:migrate
npm run dev            # http://localhost:8090
```

Test with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP → http://localhost:8090/mcp
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_URL` | yes | Public URL of this service (used in OAuth metadata). Set it before the first deploy |
| `PORT` | no | Default `8090` |
| `BACKEND_API_URL` | yes | CDF Finance API URL |
| `DATABASE_URL` | yes | Postgres database dedicated to this service |
| `TOKEN_ENCRYPTION_KEY` | yes | 32 bytes in base64: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `SESSION_SECRET` | yes | Long random string for the authorization cookies |
| `MCP_SERVICE_TOKEN` | no | Secret for internal service-to-service calls. If unset, OAuth only |
| `MCP_TOOLS_MODE` | no | `full` (default) or `readonly` |
| `OPENAI_APPS_CHALLENGE_TOKEN` | no | OpenAI domain verification |
| `ALLOWED_ORIGINS` | no | CORS origins allowed on `/authorize`. Default: `https://claude.ai,https://chatgpt.com` |

See the commented [`.env.example`](./.env.example).

### Deploy

1. Create the service on any host that runs Node 20+ (the [`Dockerfile`](./Dockerfile) is included).
2. Provision a Postgres database and inject `DATABASE_URL`.
3. Set the variables above. Generate the public domain **before** the first deploy, since it goes into `PUBLIC_URL`.
4. Start with `node dist/index.js`.
5. Run the migration: `npm run db:migrate`.
6. In Claude.ai or ChatGPT, point the connector at `https://<your-domain>/mcp`. OAuth is automatic.

---

## Security

- **PKCE S256 required** for every `authorization_code`.
- **Public methods without a token:** only `initialize`, `ping`, `notifications/initialized` and `tools/list` ([`src/mcp/public.ts`](./src/mcp/public.ts)). None of them access user data.
- **Opaque tokens:** the server stores only token hashes; the raw value is delivered once.
- **Credentials encrypted at rest** (AES-256-GCM).
- **Response sanitization:** inline images and sensitive fields are stripped before reaching the model.

Report vulnerabilities in [`SECURITY.md`](./SECURITY.md). **Do not open a public issue:** write to `support@cdf.finance` with the subject `[SECURITY]`.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). By contributing, you license your contribution under `BUSL-1.1`.

## License

Source-available under **[BUSL-1.1](./LICENSE)**. Use with CDF Finance, personal use, academic use and contributions are free. **Prohibited:** production use as a competing personal finance management product (hosted or managed). Converts to `Apache-2.0` on `2030-09-01`.

Commercial inquiries: `support@cdf.finance`.

---

<p align="center">
  <sub>Built with <a href="https://modelcontextprotocol.io">Model Context Protocol</a> · Maintained by <a href="https://cdf.finance">Vessell CDF Finance</a></sub>
</p>
