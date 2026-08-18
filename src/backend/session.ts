import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { sessions } from "../db/schema.js";
import { decrypt, encrypt } from "../crypto.js";
import * as backend from "./client.js";

const REFRESH_SKEW_MS = 60_000; // renova 60s antes do vencimento anunciado (expires_in)

/** Cria a sessão a partir de um login bem-sucedido no backend-husk. */
export async function createSession(email: string, password: string): Promise<string> {
  const tempSessionId = crypto.randomUUID();
  const result = await backend.login(email, password, tempSessionId);

  const [row] = await db
    .insert(sessions)
    .values({
      id: tempSessionId,
      backendUserId: String(result.user.id ?? ""),
      backendEmail: email,
      encAccessToken: encrypt(result.access_token),
      accessTokenExpiresAt: new Date(Date.now() + result.expires_in * 1000),
      encRefreshToken: encrypt(result.refresh_token),
    })
    .returning({ id: sessions.id });

  return row.id;
}

/** Retorna um access token válido do backend-husk para a sessão, renovando se necessário. */
export async function getValidAccessToken(sessionId: string): Promise<string> {
  const row = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!row) throw new Error("sessão inexistente");

  if (row.accessTokenExpiresAt.getTime() - REFRESH_SKEW_MS > Date.now()) {
    return decrypt(row.encAccessToken);
  }

  const refreshToken = decrypt(row.encRefreshToken);
  const result = await backend.refresh(refreshToken, sessionId);

  await db
    .update(sessions)
    .set({
      encAccessToken: encrypt(result.access_token),
      accessTokenExpiresAt: new Date(Date.now() + result.expires_in * 1000),
      encRefreshToken: encrypt(result.refresh_token),
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId));

  return result.access_token;
}
