import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { oauthClients, oauthCodes, oauthTokens } from "../db/schema.js";
import { generateOpaqueToken, sha256 } from "../crypto.js";

const CODE_TTL_MS = 5 * 60_000;
const ACCESS_TOKEN_TTL_MS = 60 * 60_000; // 1h — refresh_token não expira (revogável)

export async function registerClient(clientName: string | undefined, redirectUris: string[]) {
  const clientId = randomUUID();
  await db.insert(oauthClients).values({ clientId, clientName, redirectUris });
  return clientId;
}

export async function getClient(clientId: string) {
  return db.query.oauthClients.findFirst({ where: eq(oauthClients.clientId, clientId) });
}

export async function createAuthorizationCode(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  sessionId: string;
}) {
  const code = generateOpaqueToken("code").raw;
  await db.insert(oauthCodes).values({
    code,
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod,
    sessionId: params.sessionId,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

/** Consome o code (uso único) — retorna null se inválido/expirado/já usado. */
export async function consumeAuthorizationCode(code: string) {
  const row = await db.query.oauthCodes.findFirst({ where: eq(oauthCodes.code, code) });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  await db.update(oauthCodes).set({ usedAt: new Date() }).where(eq(oauthCodes.code, code));
  return row;
}

export async function issueTokenPair(clientId: string, sessionId: string) {
  const access = generateOpaqueToken("mat");
  const refresh = generateOpaqueToken("mrt");
  await db.insert(oauthTokens).values({
    accessTokenHash: access.hash,
    refreshTokenHash: refresh.hash,
    clientId,
    sessionId,
    accessExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
  });
  return {
    accessToken: access.raw,
    refreshToken: refresh.raw,
    expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
  };
}

/** Rotaciona o refresh token e emite um novo par (invalida o anterior). */
export async function rotateTokenPair(oldRefreshToken: string) {
  const hash = sha256(oldRefreshToken);
  const row = await db.query.oauthTokens.findFirst({
    where: and(eq(oauthTokens.refreshTokenHash, hash), eq(oauthTokens.revoked, false)),
  });
  if (!row) return null;
  await db.update(oauthTokens).set({ revoked: true }).where(eq(oauthTokens.accessTokenHash, row.accessTokenHash));
  return issueTokenPair(row.clientId, row.sessionId);
}

/** Resolve um access token opaco -> sessionId, validando expiração/revogação. */
export async function resolveAccessToken(accessToken: string) {
  const hash = sha256(accessToken);
  const row = await db.query.oauthTokens.findFirst({ where: eq(oauthTokens.accessTokenHash, hash) });
  if (!row) return null;
  if (row.revoked) return null;
  if (row.accessExpiresAt.getTime() < Date.now()) return null;
  return { sessionId: row.sessionId, clientId: row.clientId };
}
