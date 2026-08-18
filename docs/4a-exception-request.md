# Pedido de exceção — Seção 4.A (Política de Diretório de Software da Anthropic)

**Servidor:** `io.github.VessellTech/cdf.mcp` (v0.1.x)
**Nome público:** CDF Finance MCP
**Website:** <https://cdf.finance/mcp> | **URL remota:** <https://mcp.cdf.finance/mcp>
**Contato:** `support@cdf.finance`

A seção 4.A da política não permite, salvo autorização expressa por escrito,
software que "transfere dinheiro, criptomoedas ou outros ativos financeiros, ou
executa transações financeiras em nome dos usuários". O CDF Finance MCP não faz
nenhuma dessas coisas — o que se segue é o pedido formal para registrar esse
entendimento por escrito.

---

## Modelo de mensagem (PT)

> **Assunto:** Pedido de exceção por escrito — Seção 4.A — `io.github.VessellTech/cdf.mcp`
>
> Olá, equipe do Diretório de Software da Anthropic.
>
> Publicamos o servidor MCP **CDF Finance MCP** (`io.github.VessellTech/cdf.mcp`)
> no MCP Registry e, ao revisar a Seção 4.A da Política de Diretório de
> Software, entendemos que ele não se enquadra na restrição, mas solicitamos
> formalmente a autorização expressa por escrito para garantir a elegibilidade.
>
> O CDF Finance é um aplicativo de **controle financeiro pessoal** (registro de
> receitas e despesas, orçamentos, metas e projeções). O conector MCP:
>
> - **Não transfere, movimenta ou envia dinheiro, criptomoedas ou qualquer
>   outro ativo financeiro** — não há integração com sistemas de pagamento,
>   PIX, TED, cartão ou carteiras.
> - **Não executa transações financeiras em nome do usuário** — as tools de
>   escrita apenas *registram lançamentos* (ex.: "lança um Uber de R$ 27") no
>   mesmo controle que o usuário faria manualmente no app; nenhuma ordem de
>   pagamento é emitida.
> - **Não é um veículo de publicidade** e não transfere ativos.
>
> Além disso, oferecemos um **modo somente leitura** (`MCP_TOOLS_MODE=readonly`)
> que expõe apenas tools de consulta, e toda ação de escrita é explícita e
> solicitada pelo usuário na conversa, com revogação a qualquer momento
> (a conexão aparece como dispositivo na conta).
>
> Solicita-se a confirmação por escrito de que este servidor é elegível para
> listagem no diretório, ou a orientação sobre o caminho adequado. Estamos à
> disposição para fornecer acesso de teste (conta com dados de amostra),
> documentação completa e o que mais for necessário para a revisão.
>
> Atenciosamente,
> Equipe CDF Finance — `support@cdf.finance` — <https://cdf.finance>

## Modelo de mensagem (EN)

> **Subject:** Written exception request — Section 4.A — `io.github.VessellTech/cdf.mcp`
>
> Hello Anthropic Software Directory team,
>
> We published the **CDF Finance MCP** server (`io.github.VessellTech/cdf.mcp`)
> to the MCP Registry. While reviewing Section 4.A of the Software Directory
> Policy, we believe our server does not fall under the restriction, but we are
> formally requesting the express written authorization to confirm eligibility.
>
> CDF Finance is a **personal finance management app** (income and expense
> tracking, budgets, goals, and projections). The MCP connector:
>
> - **Does not transfer, move, or send money, cryptocurrency, or any other
>   financial asset** — there is no integration with payment systems, PIX,
>   bank transfers, cards, or wallets.
> - **Does not execute financial transactions on behalf of users** — the
>   write tools only *record entries* (e.g., "log an Uber ride of R$ 27") in
>   the same ledger the user would maintain manually in the app; no payment
>   order is ever issued.
> - **Is not an advertising vehicle** and does not transfer assets.
>
> We also offer a **read-only mode** (`MCP_TOOLS_MODE=readonly`) that exposes
> only query tools, and every write action is explicit and requested by the
> user in the conversation, revocable at any time (the connection appears as a
> device in the user's account).
>
> We ask for written confirmation that this server is eligible for directory
> listing, or guidance on the proper path. We are happy to provide a test
> account with sample data, full documentation, and anything else required for
> review.
>
> Best regards,
> CDF Finance Team — `support@cdf.finance` — <https://cdf.finance>

---

## Onde enviar

Canais sugeridos (por ordem de probabilidade de resposta):

1. **Suporte do Claude** (artigo da política) — formulário de feedback/contato
   da central de ajuda da Anthropic.
2. **Anthropic Developer Partnership Program** — <https://www.anthropic.com/developers>.
3. **GitHub `modelcontextprotocol/registry`** — como *issue* de discussão,
   citando a seção 4.A e o pedido (público, para registro).
