# Contributing to cdf-mcp-server

Obrigado por considerar contribuir. Este repo é **source-available (BUSL-1.1)** — você pode ler, auditar e propor melhorias, mas uso em produção como produto concorrente exige licença comercial (ver [`LICENSE`](./LICENSE)).

## O que aceitamos

- **Correções e melhorias no catálogo declarativo** (`src/tools/catalog/`): nova tool = nova entrada `{ name, method, path, input(zod) }` — sem handler manual. Siga o padrão de `src/tools/types.ts:5`.
- **Hardening de segurança/OAuth**: PKCE, criptografia `src/crypto.ts`, `src/oauth/*`, `src/mcp/http.ts`.
- **DX, docs e infra**: `README.md`, `Dockerfile`, `railway.json`, `drizzle/*`.
- **Não aceitamos**: mudanças que quebrem isolamento do `backend-husk` (este serviço nunca importa código do backend — só HTTP via `src/backend/client.ts:18`), nem exposição de rotas fora de escopo (`admin`, `Stripe`, `/api/ai/*`, `S3`).

## Setup local

```bash
cp .env.example .env   # preencha DATABASE_URL, TOKEN_ENCRYPTION_KEY, SESSION_SECRET
npm install
npm run db:migrate
npm run dev            # http://localhost:8090
```

Teste com MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP, URL: http://localhost:8090/mcp
```

## Padrão de contribuição

1. Abra uma **issue** primeiro para features relevantes (evita retrabalho no catálogo).
2. Fork + branch `feat/minha-tool` ou `fix/xyz`.
3. Mantenha o executor genérico intacto (`src/tools/register.ts:57`) — não adicione handlers ad-hoc. Se precisar de `resolvePath`, `redactFields` ou `outputSchema`, declare no `ToolDef`.
4. Preservar anotações MCP: `readOnly`, `destructive`, `openWorldHint:false` são auditadas pelos diretórios (Anthropic/OpenAI).
5. Rode `npm run build` antes de abrir PR — CI exige `tsc` sem erros.
6. Descreva no PR: tool(s) afetada(s), path do backend-husk validado, e se precisa de `MCP_TOOLS_MODE` check.

## Convenções

- **Commits**: `feat(catalog): add pix_tools` / `fix(oauth): ...` / `docs: ...`
- **Zod**: toda tool precisa de `input` validado; `outputSchema` com campos opcionais/nuláveis (SDK valida `structuredContent`).
- **Segredos**: nunca commite `.env`, `TOKEN_ENCRYPTION_KEY` ou `SESSION_SECRET`. `.gitignore:3` já cobre.

## CLA / Licença da contribuição

Ao abrir PR você concorda que sua contribuição será licenciada sob os mesmos termos do repo (**BUSL-1.1**, futura `Apache-2.0` em `2030-09-01` — ver `LICENSE:31`). Se sua empresa precisa de termos diferentes, fale antes com `support@cdf.finance`.

## Dúvidas

- Docs de arquitetura: `README.md:22`
- Conformidade 4.A Anthropic: `docs/4a-exception-request.md`
- Contato: `support@cdf.finance`
