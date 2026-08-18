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

## Exemplos de prompts

Três exemplos funcionais do que dá para pedir — dois de consulta e um de
escrita — cobrindo a funcionalidade principal:

| # | Português | English |
|---|-----------|---------|
| 1 | "Quanto sobrou do meu salário esse mês?" | "How much is left of my salary this month?" |
| 2 | "Minha próxima fatura de cartão vai caber no orçamento deste mês?" | "Will my next credit card bill fit in this month's budget?" |
| 3 | "Lança um Uber de R$ 27,50 na minha conta Nubank e categoriza como Transporte." | "Log an Uber ride of R$ 27.50 on my Nubank account and categorize it as Transportation." |

## Revisão para diretórios (Anthropic)

- **Conta de teste** (com dados de amostra, para revisores verificarem a
  funcionalidade completa): `joao@teste.com` / `123456`.
- **Suporte e contato**: `support@cdf.finance` — site: <https://cdf.finance>.
- **Status do serviço**: <https://status.cdf.finance> (BetterStack).

## Escopo e conformidade (4.A da Política de Diretório da Anthropic)

O conector **não transfere dinheiro, criptomoedas ou outros ativos financeiros**
e **não executa transações financeiras em nome do usuário**: ele apenas lê e
registra lançamentos num app de controle financeiro pessoal — o mesmo que o
app faz — e toda ação de escrita é explícita e solicitada pelo usuário na
conversa.

- **Modo somente leitura**: defina `MCP_TOOLS_MODE=readonly` no deploy para
  expor apenas tools de consulta (`readOnly: true`), ocultando criação,
  edição e exclusão do catálogo. O padrão é `full`.
- **Pedido de exceção por escrito** (previsto na própria seção 4.A): ver
  `docs/4a-exception-request.md`.

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
