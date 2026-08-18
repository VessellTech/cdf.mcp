import { createHash } from "node:crypto";

/** PKCE S256 é obrigatório neste servidor (spec MCP exige PKCE em todo fluxo de authorization code). */
export function verifyPkce(codeVerifier: string, codeChallenge: string, method: string): boolean {
  if (method !== "S256") return false;
  const computed = createHash("sha256").update(codeVerifier).digest("base64url");
  return computed === codeChallenge;
}
