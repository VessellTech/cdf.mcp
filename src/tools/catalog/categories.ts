import { z } from "zod";
import type { ToolDef } from "../types.js";

// --- Shapes de saída (espelham as queries de categories.husk / costcenters.husk + schema Prisma) ---

const countShape = z.object({
  count: z.number().optional(),
});

const successShape = z.object({
  success: z.boolean().optional(),
});

const categoryShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["EXPENSE", "INCOME"]).optional(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  globalCategoryId: z.string().optional().nullable(),
  globalSubcategoryId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const costCenterShape = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const categoryTools: ToolDef[] = [
  {
    name: "list_categories",
    title: "Listar categorias",
    description:
      "Lista todas as categorias e subcategorias do usuário (achatado — subcategorias vêm no mesmo array que as categorias-pai, diferenciadas por `parentId`), ordenado por criação (mais recente primeiro). Para gasto acumulado/orçamento por categoria use categories_insights, não esta tool.",
    method: "GET",
    path: "/api/categories",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(categoryShape) }),
  },
  {
    name: "create_category",
    title: "Criar categoria",
    description:
      "Cria uma categoria ou subcategoria do usuário (informe `parentId` para criar como subcategoria — o pai precisa ser do mesmo `type`). Opcionalmente vincula a um catálogo global (`globalCategoryId`/`globalSubcategoryId`): se informado, o `type` é herdado do registro global e um `type` divergente enviado junto gera erro 400.",
    method: "POST",
    path: "/api/categories",
    input: {
      name: z.string().describe("Nome da categoria/subcategoria"),
      type: z.string().describe("EXPENSE ou INCOME. Se globalCategoryId/globalSubcategoryId for informado, o type é herdado dali e precisa bater com o valor enviado aqui"),
      icon: z.string().optional().describe("Nome do ícone, ex: 'shopping-cart'"),
      color: z.string().optional().describe("Cor hex, ex: #3B82F6"),
      parentId: z.string().optional().describe("ID de outra categoria do usuário para criar esta como subcategoria dela (precisa ter o mesmo type)"),
      globalCategoryId: z.string().optional().describe("ID de uma categoria do catálogo global (GlobalCategory) para vincular"),
      globalSubcategoryId: z.string().optional().describe("ID de uma subcategoria do catálogo global (GlobalSubcategory) para vincular — se informado, também resolve/preenche globalCategoryId a partir do pai dela"),
    },
    outputSchema: categoryShape,
  },
  {
    name: "update_category",
    title: "Atualizar categoria",
    description:
      "Atualiza campos de uma categoria (parcial — campo omitido/vazio mantém o valor atual). Mesmas validações de create_category: parentId precisa ser de uma categoria própria do usuário com o mesmo type (e não pode ser a própria categoria), e vínculo com catálogo global exige type compatível.",
    method: "PUT",
    path: "/api/categories/:id",
    input: {
      id: z.string().describe("ID da categoria a atualizar"),
      name: z.string().optional().describe("Novo nome da categoria/subcategoria"),
      type: z.string().optional().describe("EXPENSE ou INCOME"),
      icon: z.string().optional().describe("Nome do ícone, ex: 'shopping-cart'"),
      color: z.string().optional().describe("Cor hex, ex: #3B82F6"),
      parentId: z.string().optional().describe("ID de outra categoria do usuário para tornar esta uma subcategoria dela"),
      globalCategoryId: z.string().optional().describe("ID de uma categoria do catálogo global para vincular"),
      globalSubcategoryId: z.string().optional().describe("ID de uma subcategoria do catálogo global para vincular"),
    },
    outputSchema: countShape,
  },
  {
    name: "delete_category",
    title: "Excluir categoria",
    description:
      "Exclui uma categoria (ou subcategoria) permanentemente. Não há verificação de transações/orçamentos vinculados antes de excluir — não exclui em cascata subcategorias filhas.",
    method: "DELETE",
    path: "/api/categories/:id",
    input: { id: z.string().describe("ID da categoria a excluir") },
    destructive: true,
    outputSchema: countShape,
  },
  {
    name: "list_cost_centers",
    title: "Listar centros de custo",
    description:
      "Lista os centros de custo do usuário (ex: 'Pessoal', 'Empresa X'), ordenados por criação (mais antigo primeiro). Todo usuário tem ao menos um centro de custo padrão (`isDefault: true`), que não pode ser excluído.",
    method: "GET",
    path: "/api/cost-centers",
    input: {},
    readOnly: true,
    outputSchema: z.object({ data: z.array(costCenterShape) }),
  },
  {
    name: "create_cost_center",
    title: "Criar centro de custo",
    description: "Cria um centro de custo novo (não-padrão — `isDefault` sempre começa false).",
    method: "POST",
    path: "/api/cost-centers",
    input: {
      name: z.string(),
      description: z.string().optional().describe("Descrição livre do centro de custo"),
    },
    outputSchema: costCenterShape,
  },
  {
    name: "update_cost_center",
    title: "Atualizar centro de custo",
    description: "Atualiza nome/descrição de um centro de custo (parcial — campo omitido/vazio mantém o valor atual).",
    method: "PUT",
    path: "/api/cost-centers/:id",
    input: {
      id: z.string().describe("ID do centro de custo a atualizar"),
      name: z.string().optional(),
      description: z.string().optional(),
    },
    outputSchema: costCenterShape,
  },
  {
    name: "delete_cost_center",
    title: "Excluir centro de custo",
    description:
      "Exclui um centro de custo permanentemente. Retorna erro se o centro de custo for o padrão (`isDefault: true`) — todo usuário precisa ter ao menos um. Não verifica transações/recorrências vinculadas antes de excluir.",
    method: "DELETE",
    path: "/api/cost-centers/:id",
    input: { id: z.string().describe("ID do centro de custo a excluir") },
    destructive: true,
    outputSchema: successShape,
  },
];
