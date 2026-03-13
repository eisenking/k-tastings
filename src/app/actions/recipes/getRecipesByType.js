// "use server";

// import { db } from "@/drizzle/db";
// import { eq, sql, desc, and } from "drizzle-orm";
// import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";


// export async function getRecipesByType(type, preparationCategory) {
//   const whereClause =
//     type === "preparation" && preparationCategory
//       ? and(eq(RecipesTable.type, type), eq(RecipesTable.preparationCategory, preparationCategory))
//       : eq(RecipesTable.type, type);

//   const rows = await db
//     .select({
//       id: RecipesTable.id,
//       name: RecipesTable.name,
//       type: RecipesTable.type,
//       preparationCategory: RecipesTable.preparationCategory,
//       defaultYieldBase: RecipesTable.defaultYieldBase,
//       steps: RecipesTable.steps,
//       note: RecipesTable.note,
//       isArchived: RecipesTable.isArchived,
//       createdAt: RecipesTable.createdAt,
//       updatedAt: RecipesTable.updatedAt,

//       remainingBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("remainingBase"),
//     })
//     .from(RecipesTable)
//     .leftJoin(ProductionBatchesTable, eq(ProductionBatchesTable.recipeId, RecipesTable.id))
//     .where(whereClause)
//     .groupBy(
//       RecipesTable.id,
//       RecipesTable.name,
//       RecipesTable.type,
//       RecipesTable.preparationCategory,
//       RecipesTable.defaultYieldBase,
//       RecipesTable.steps,
//       RecipesTable.note,
//       RecipesTable.isArchived,
//       RecipesTable.createdAt,
//       RecipesTable.updatedAt,
//     )
//     .orderBy(desc(RecipesTable.updatedAt));

//   return rows;
// }


"use server";

import { db } from "@/drizzle/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { RecipesTable, ProductionBatchesTable, RecipeItemsTable } from "@/drizzle/schema";

export async function getRecipesByType(type, preparationCategory) {
  const whereClause =
    type === "preparation" && preparationCategory
      ? and(eq(RecipesTable.type, type), eq(RecipesTable.preparationCategory, preparationCategory))
      : eq(RecipesTable.type, type);

  // aliases
  const parentItems = sql`${RecipeItemsTable} as parent_items`;
  const parentRecipes = sql`${RecipesTable} as parent_recipes`;

  const rows = await db
    .select({
      id: RecipesTable.id,
      name: RecipesTable.name,
      type: RecipesTable.type,
      preparationCategory: RecipesTable.preparationCategory,
      defaultYieldBase: RecipesTable.defaultYieldBase,
      note: RecipesTable.note,
      isArchived: RecipesTable.isArchived,
      createdAt: RecipesTable.createdAt,
      updatedAt: RecipesTable.updatedAt,

      remainingBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("remainingBase"),

      // 👇 Список начинок, где используется эта заготовка
      usedInFillings: sql`
      COALESCE(
        jsonb_agg(DISTINCT parent_recipes.name ORDER BY parent_recipes.name),
        '[]'::jsonb
      )
      `.as("usedInFillings"),
    })
    .from(RecipesTable)
    .leftJoin(ProductionBatchesTable, eq(ProductionBatchesTable.recipeId, RecipesTable.id))

    // где текущая заготовка выступает child_recipe_id
    .leftJoin(
      parentItems,
      sql`parent_items.child_recipe_id = ${RecipesTable.id} AND parent_items.ref_type = 'recipe'`
    )

    // родитель = начинка
    .leftJoin(
      parentRecipes,
      sql`parent_recipes.id = parent_items.recipe_id AND parent_recipes.type = 'filling'`
    )

    .where(whereClause)
    .groupBy(
      RecipesTable.id,
      RecipesTable.name,
      RecipesTable.type,
      RecipesTable.preparationCategory,
      RecipesTable.defaultYieldBase,
      RecipesTable.note,
      RecipesTable.isArchived,
      RecipesTable.createdAt,
      RecipesTable.updatedAt,
    )
    .orderBy(desc(RecipesTable.updatedAt));

  return rows;
}