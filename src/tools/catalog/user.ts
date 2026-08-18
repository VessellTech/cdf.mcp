import { z } from "zod";
import type { ToolDef } from "../types.js";

export const userTools: ToolDef[] = [
  {
    name: "get_profile",
    title: "Perfil do usuário",
    description: "Retorna o perfil do usuário autenticado (sem dados sensíveis).",
    method: "GET",
    path: "/api/user/me",
    input: {},
    readOnly: true,
  },
  {
    name: "update_profile",
    title: "Atualizar perfil",
    description: "Atualiza campos do perfil do usuário (parcial).",
    method: "PUT",
    path: "/api/users/me",
    input: { name: z.string().optional(), phone: z.string().optional(), currency: z.string().optional() },
  },
];
