# cdf-mcp-server

MCP remoto do Vessell CDF — permite conectar Claude, ChatGPT (ou qualquer
client MCP compatível com OAuth 2.1) diretamente à conta financeira do
usuário: consultar contas, cartões, transações, orçamentos, metas, dívidas,
investimentos e insights, e também criar/editar transações via linguagem
natural.

## Por que é um serviço isolado

Este serviço **não importa nenhum código do `web/backend-husk`**. A única
ponte entre os dois é HTTP — o mesmo contrato REST que o app mobile usa
(`/api/mobile/auth/login`, `/api/mobile/auth/refresh` e as rotas
`[autenticado]` com `Authorization: Bearer <mobile JWT>`). Isso:

- Elimina qualquer possibilidade de dependência circular entre o backend e o MCP.
- Permite deployar, escalar e versionar o MCP de forma independente (Railway),
  sem tocar no pipeline do backend-husk (Coolify).
- Se o backend-husk mudar de linguagem/framework de novo (como já mudou de
  Node para Husk), o MCP não precisa mudar uma linha — ele só fala HTTP.

## Arquitetura

```
Claude/ChatGPT (client MCP)
        │  OAuth 2.1 (DCR + PKCE)
        ▼
┌───────────────────────────────┐
│  cdf-mcp-server (este repo)    │
│  - Authorization Server        │  banco Postgres próprio (Railway)
│  - Resource Server (/mcp)      │  guarda: oauth_clients, oauth_codes,
│  - tools/ catálogo declarativo │  oauth_tokens, sessions (com o JWT
│    (~50 tools -> rotas REST)   │  mobile do backend-husk criptografado)
└───────────────┬────────────────┘
                │ HTTPS — Bearer <mobile JWT>
                ▼
        web/backend-husk (API pública, produção)
```

### Fluxo de login

1. O client MCP (Claude/ChatGPT) faz Dynamic Client Registration em `/register`.
2. Usuário é redirecionado para `/authorize` → formulário de e-mail/senha do
   Vessell (server-rendered, sem terceiros).
3. O `/authorize` chama `POST /api/mobile/auth/login` no backend-husk com
   `device_id = mcp-<sessionId>`, `platform = "mcp"` — o backend trata o MCP
   como mais um device (aparece em `GET /api/mobile/devices`, pode ser
   revogado por lá).
4. O par access/refresh token do backend fica guardado, criptografado
   (AES-256-GCM), na tabela `sessions`. O client MCP nunca vê esse token —
   recebe um token opaco próprio do MCP (`oauth_tokens`).
5. A cada chamada de tool, o backend renova o access token do backend-husk
   automaticamente via refresh token quando necessário (`getValidAccessToken`).

## Tools expostos

Ver `src/tools/catalog/` — organizados por domínio (accounts, cards,
categories, transactions, recurring, invoices, goals/budgets/debts,
equities/investments, insights/analytics, user). Cada tool é uma entrada
declarativa `{ name, method, path, input(zod) }` executada por um único
executor genérico (`src/tools/register.ts`) que mapeia o input para
parâmetros de rota / query / body do backend-husk. Adicionar uma rota nova
do backend = adicionar uma entrada no catálogo, sem escrever handler.

Fora de escopo (de propósito, iguais ao PORT.md do backend-husk): admin,
pagamentos/Stripe, webhooks, anexos (S3, binário), rotas de IA (`/api/ai/*`
— o próprio MCP já cobre esse caso de uso, não faz sentido expor "chame a IA
interna" como tool de uma IA externa).

## Rodando localmente

```bash
cp .env.example .env   # preencha DATABASE_URL, TOKEN_ENCRYPTION_KEY, SESSION_SECRET
npm install
npm run db:migrate
npm run dev
```

Teste com o [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP, URL: http://localhost:8090/mcp
```

## Deploy na Railway

1. `railway init` neste diretório (ou conecte o repo pelo dashboard).
2. Adicione um addon **Postgres** — isso injeta `DATABASE_URL` automaticamente
   (é um banco só deste serviço, não compartilhado com o backend-husk).
3. Configure as variáveis de ambiente (ver `.env.example`):
   - `PUBLIC_URL` → a URL pública que a Railway gerar para este serviço
     (precisa ser conhecida ANTES do primeiro deploy, pois entra nos metadados
     OAuth — gere o domínio primeiro em Settings → Networking, depois faça o
     deploy).
   - `BACKEND_API_URL` → URL de produção do backend-husk.
   - `TOKEN_ENCRYPTION_KEY` → `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `SESSION_SECRET` → qualquer string aleatória longa.
4. Deploy (o `Dockerfile` builda e roda `node dist/index.js`; o `railway.json`
   já aponta pra ele).
5. Rode a migration uma vez contra o banco de produção:
   `railway run npm run db:migrate`.
6. No Claude.ai / ChatGPT, adicione o connector apontando para
   `https://<seu-dominio>.up.railway.app/mcp` — o fluxo de OAuth/DCR é
   automático a partir daí.

## Segurança

- PKCE (S256) obrigatório em todo fluxo de authorization code.
- Tokens do MCP entregues ao client são opacos; só o hash SHA-256 fica no banco.
- O JWT mobile do backend-husk fica criptografado em repouso (AES-256-GCM) e
  nunca é exposto ao client MCP.
- Cada sessão MCP é um "device" distinto no backend-husk — revogável em
  `DELETE /api/mobile/devices/:id` sem afetar outros logins do usuário.
