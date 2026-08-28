import { z } from "zod";
import type { ToolDef } from "../types.js";

// Campos do perfil (User) devolvidos por update_profile. Todos optional/nullable:
// o SDK do MCP valida structuredContent contra o outputSchema e o backend pode
// omitir campos ou devolver null (colunas nullable, LEFT JOIN etc).
const profileFields = {
  id: z.string().optional(),
  auth0Id: z.string().optional().nullable(),
  email: z.string().optional(),
  name: z.string().optional().nullable(),
  type: z.enum(["PERSONAL", "PLANNER", "ADMIN"]).optional(),
  onboardingCompleted: z.boolean().optional(),
  hasBusiness: z.boolean().optional(),
  businessCnpj: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  businessWebsite: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  picture: z.string().optional().nullable(),
  currency: z.string().optional(),
  plan: z.enum(["FREE", "PRO_MONTHLY", "PRO_ANNUAL"]).optional(),
  menuPreference: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};

// GET /api/user/me (user_by_id_safe) — superset do perfil, com campos de
// assinatura/planner que update_profile não devolve.
const fullProfileShape = {
  ...profileFields,
  coverImage: z.string().optional().nullable(),
  plannerId: z.string().optional().nullable(),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
  subscriptionCurrentPeriodEnd: z.string().optional().nullable(),
  subscriptionStatus: z.string().optional().nullable(),
};

export const userTools: ToolDef[] = [
  {
    name: "get_profile",
    title: "Perfil do usuário",
    description: "Retorna o perfil do usuário autenticado (sem dados sensíveis).",
    method: "GET",
    path: "/api/user/me",
    input: {},
    readOnly: true,
    outputSchema: z.object(fullProfileShape).omit({ phone: true }),
    redactFields: ["phone"],
  },
  {
    name: "update_profile",
    title: "Atualizar perfil",
    description: "Atualiza campos do perfil do usuário (parcial).",
    method: "PUT",
    path: "/api/users/me",
    input: { name: z.string().optional(), phone: z.string().optional(), currency: z.string().optional() },
    outputSchema: z.object(profileFields),
  },
];
