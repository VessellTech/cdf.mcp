import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PUBLIC_URL: z.string().url(),
  PORT: z.coerce.number().default(8090),
  BACKEND_API_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().min(1, "gere com node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""),
  SESSION_SECRET: z.string().min(16),
  ALLOWED_ORIGINS: z.string().default(""),
  /** "full" expõe o catálogo completo; "readonly" só tools de consulta (readOnly: true). */
  MCP_TOOLS_MODE: z.enum(["full", "readonly"]).default("full"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuração inválida (.env):", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
