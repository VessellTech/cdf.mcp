# Contributing to cdf-mcp-server

Obrigado por considerar contribuir. Este repo é **source-available (BUSL-1.1)** — você pode ler, auditar e propor melhorias, mas uso em produção como produto concorrente exige licença comercial (ver [`LICENSE`](./LICENSE)).

## O que aceitamos

- **Correções e melhorias no catálogo declarativo** (`src/tools/catalog/`): nova tool = nova entrada `{ name, method, path, input(zod) }` — sem handler manual. Siga o padrão de `src/tools/types.ts`.
- **Hardening de segurança/OAuth**: PKCE, criptografia (`src/crypto.ts`), `src/oauth/*`, `src/mcp/*`.
- **DX, docs e infra**: `README.md`, `Dockerfile`, `drizzle/*`.
- **Não aceitamos**: mudanças que quebrem o isolamento do serviço (ele nunca importa código da API, só fala HTTP via `src/backend/client.ts`), nem exposição de rotas fora de escopo (administração, pagamentos, `/api/ai/*`, armazenamento de arquivos).

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
3. Mantenha o executor genérico intacto (`src/tools/register.ts`) — não adicione handlers ad-hoc. Se precisar de `resolvePath`, `redactFields` ou `outputSchema`, declare no `ToolDef`.
4. Preserve as anotações MCP: `readOnly`, `destructive` e `openWorldHint: false` são auditadas pelos diretórios de apps.
5. Rode `npm run build` antes de abrir PR — o build precisa passar sem erros de `tsc`.
6. Descreva no PR: tool(s) afetada(s), rota validada na API, e se precisa de checagem do `MCP_TOOLS_MODE`.

## Convenções

- **Commits**: `feat(catalog): add pix_tools` / `fix(oauth): ...` / `docs: ...`
- **Zod**: toda tool precisa de `input` validado; `outputSchema` com campos opcionais/nuláveis (o SDK valida `structuredContent`).
- **Segredos**: nunca commite `.env`, `TOKEN_ENCRYPTION_KEY` ou `SESSION_SECRET`. O `.gitignore` já cobre `.env`.

## CLA / Licença da contribuição

Ao abrir PR você concorda que sua contribuição será licenciada sob os mesmos termos do repo (**BUSL-1.1**, futura `Apache-2.0` em `2030-09-01` — ver `LICENSE`). Se sua empresa precisa de termos diferentes, fale antes com `support@cdf.finance`.

## Dúvidas

- Arquitetura: seção "How it works" / "Como funciona" no `README.md`
- Contato: `support@cdf.finance`
