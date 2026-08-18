import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "./config.js";

const key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, "base64");
if (key.length !== 32) {
  throw new Error("TOKEN_ENCRYPTION_KEY precisa decodificar (base64) para 32 bytes");
}

/** AES-256-GCM: usado para guardar os tokens do backend-husk em repouso. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Tokens opacos entregues ao client MCP (Claude/ChatGPT). Só o hash SHA-256 é persistido. */
export function generateOpaqueToken(prefix: string): { raw: string; hash: string } {
  const raw = `${prefix}_${randomBytes(32).toString("base64url")}`;
  return { raw, hash: sha256(raw) };
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
