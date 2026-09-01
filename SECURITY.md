# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

Apenas a última versão publicada em `main` recebe correções de segurança.

## Reporting a Vulnerability

**Não abra issue pública** para vulnerabilidades.

Reporte em: **support@cdf.finance** com assunto `[SECURITY] cdf-mcp-server`.

Inclua:

- Descrição, impacto e passos para reproduzir
- Versão/commit afetado
- Se possível, PoC sem exfiltrar dados reais de usuários

O que acontece depois:

1. Confirmação em até **2 dias úteis**.
2. Avaliação e triagem com severidade (CVSS).
3. Correção em branch privado + release coordenado. Você será creditado se desejar.
4. Aviso público após mitigação (sem detalhes sensíveis de usuários).

Para vulnerabilidades no **backend-husk** (`api.vessell.app`) reportadas via este MCP, encaminharemos internamente — não é preciso reportar duas vezes.

## Escopo e garantias deste serviço

Este MCP é um proxy isolado — não armazena dados financeiros, apenas tokens:

- **OAuth 2.1 + PKCE (S256)** obrigatório — ver `src/oauth/pkce.ts`, `src/oauth/router.ts`.
- **Tokens opacos**: só `SHA-256` persiste em `oauth_tokens` (`src/db/schema.ts:48`); valor bruto é entregue uma única vez em `/token`.
- **JWT mobile criptografado em repouso** (`AES-256-GCM`) em `sessions.enc_access_token` / `enc_refresh_token` (`src/crypto.ts:4`, `src/db/schema.ts:26`), nunca exposto ao client MCP (`src/mcp/http.ts:14`).
- **Isolamento**: nenhuma importação de código do `backend-husk` — só HTTP `src/backend/client.ts:18`. Cada sessão MCP = `device_id = mcp-<sessionId>` (`src/backend/client.ts:45`) revogável via `DELETE /api/mobile/devices/:id`.
- **Defesa de contexto**: `redactLargeInlineData` e `redactFields` (`src/tools/register.ts:19`, `src/tools/register.ts:99`) evitam vazamento de `data:` URI / campos sensíveis para o LLM.

### O que NÃO fazer ao testar

- Não tente acessar `DATABASE_URL` de produção, `TOKEN_ENCRYPTION_KEY` ou `SESSION_SECRET` (`src/config.ts:8-10`) — reporte a classe de falha sem exfiltrar.
- Não brute-force `/authorize` ou `/token`.
- Não exfiltre dados de outros usuários via `userId` em tools de planejador — use apenas sua conta.

## Configuração segura (deploy)

- Gere chaves com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` para `TOKEN_ENCRYPTION_KEY` (`src/config.ts:9`).
- Defina `PUBLIC_URL` antes do primeiro deploy (entra nos metadados OAuth) e `ALLOWED_ORIGINS` restrito (`src/config.ts:12`).
- `MCP_SERVICE_TOKEN` (`src/config.ts:21`) é opcional e só para chamada serviço-a-serviço `backend-husk → MCP` — não exponha publicamente.
- Rode `npm run db:migrate` uma única vez por ambiente; mantenha `drizzle/*` versionado.

## Divulgação

Pedimos **90 dias** de embargo coordenado após correção antes de publicação técnica detalhada. Issues de segurança já corrigidas são documentadas no `CHANGELOG`/`Releases` do GitHub.
