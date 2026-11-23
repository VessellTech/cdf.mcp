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

Vulnerabilidades na API do CDF Finance encontradas por meio deste servidor também podem ser reportadas no mesmo endereço; encaminhamos internamente.

## Escopo e garantias deste serviço

Este servidor é um proxy isolado — não armazena dados financeiros, apenas tokens:

- **OAuth 2.1 + PKCE (S256)** obrigatório.
- **Tokens opacos**: só o hash `SHA-256` persiste; o valor bruto é entregue uma única vez, na emissão.
- **Credenciais criptografadas em repouso** (`AES-256-GCM`), nunca expostas ao cliente MCP.
- **Isolamento**: o servidor só se comunica com a API pública do CDF Finance via HTTP. Cada sessão MCP aparece como dispositivo da conta do usuário e pode ser revogada por ele.
- **Métodos públicos sem token**: apenas `initialize`, `ping`, `notifications/initialized` e `tools/list`. Nenhum acessa dados do usuário.
- **Defesa de contexto**: campos sensíveis e imagens inline são removidos das respostas antes de chegar ao modelo.

### O que NÃO fazer ao testar

- Não tente acessar bancos de dados de produção ou as chaves de criptografia/sessão do servidor — reporte a classe da falha sem exfiltrar.
- Não faça brute-force em `/authorize` ou `/token`.
- Não acesse dados de outros usuários. Use apenas a sua conta.

## Configuração segura (deploy)

- Gere chaves com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` para `TOKEN_ENCRYPTION_KEY`.
- Defina `PUBLIC_URL` antes do primeiro deploy (entra nos metadados OAuth) e restrinja `ALLOWED_ORIGINS`.
- `MCP_SERVICE_TOKEN` é opcional e só serve para chamadas entre serviços internos — não o exponha publicamente.
- Rode `npm run db:migrate` uma única vez por ambiente; mantenha `drizzle/*` versionado.

## Divulgação

Pedimos **90 dias** de embargo coordenado após correção antes de publicação técnica detalhada. Issues de segurança já corrigidas são documentadas nas Releases do GitHub.
