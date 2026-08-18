import { pgTable, text, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";

/**
 * Schema isolado deste serviço (banco Postgres próprio na Railway).
 * Nunca compartilha tabelas/migrations com o backend-husk — a única
 * ponte entre os dois serviços é HTTP (ver src/backend/client.ts).
 */

// Clients MCP registrados via Dynamic Client Registration (Claude/ChatGPT
// se registram automaticamente na primeira conexão).
export const oauthClients = pgTable("oauth_clients", {
  clientId: text("client_id").primaryKey(),
  clientName: text("client_name"),
  redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Sessão de login: guarda o par access/refresh token do backend-husk
// (mobile JWT, HS256) obtido via POST /api/mobile/auth/login, criptografado
// em repouso. Uma sessão pode ser reaproveitada por múltiplos tokens MCP
// emitidos (refresh do MCP não exige novo login).
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  backendUserId: text("backend_user_id").notNull(),
  backendEmail: text("backend_email").notNull(),
  encAccessToken: text("enc_access_token").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }).notNull(),
  encRefreshToken: text("enc_refresh_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Authorization codes de curta duração (fluxo /authorize -> /token), PKCE obrigatório.
export const oauthCodes = pgTable("oauth_codes", {
  code: text("code").primaryKey(),
  clientId: text("client_id").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  codeChallenge: text("code_challenge").notNull(),
  codeChallengeMethod: text("code_challenge_method").notNull(),
  sessionId: uuid("session_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tokens emitidos pelo MCP para o client (Claude/ChatGPT). Só o hash é
// persistido — o valor bruto é devolvido uma única vez na resposta do /token.
export const oauthTokens = pgTable("oauth_tokens", {
  accessTokenHash: text("access_token_hash").primaryKey(),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  clientId: text("client_id").notNull(),
  sessionId: uuid("session_id").notNull(),
  accessExpiresAt: timestamp("access_expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
