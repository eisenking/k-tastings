// "use server";

// import { db } from "@/drizzle/db";
// import { eq, sql, desc, and } from "drizzle-orm";
// import { RecipesTable, ProductionBatchesTable, RecipeItemsTable } from "@/drizzle/schema";

// export async function getRecipesByType(type, preparationCategory) {
//   const whereClause =
//     type === "preparation" && preparationCategory
//       ? and(eq(RecipesTable.type, type), eq(RecipesTable.preparationCategory, preparationCategory))
//       : eq(RecipesTable.type, type);

//   // aliases
//   const parentItems = sql`${RecipeItemsTable} as parent_items`;
//   const parentRecipes = sql`${RecipesTable} as parent_recipes`;

//   const rows = await db
//     .select({
//       id: RecipesTable.id,
//       name: RecipesTable.name,
//       type: RecipesTable.type,
//       preparationCategory: RecipesTable.preparationCategory,
//       defaultYieldBase: RecipesTable.defaultYieldBase,
//       note: RecipesTable.note,
//       isArchived: RecipesTable.isArchived,
//       createdAt: RecipesTable.createdAt,
//       updatedAt: RecipesTable.updatedAt,

//       remainingBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("remainingBase"),

//       // 👇 Список начинок, где используется эта заготовка
//       usedInFillings: sql`
//       COALESCE(
//         jsonb_agg(DISTINCT parent_recipes.name ORDER BY parent_recipes.name),
//         '[]'::jsonb
//       )
//       `.as("usedInFillings"),
//     })
//     .from(RecipesTable)
//     .leftJoin(ProductionBatchesTable, eq(ProductionBatchesTable.recipeId, RecipesTable.id))

//     // где текущая заготовка выступает child_recipe_id
//     .leftJoin(
//       parentItems,
//       sql`parent_items.child_recipe_id = ${RecipesTable.id} AND parent_items.ref_type = 'recipe'`
//     )

//     // родитель = начинка
//     .leftJoin(
//       parentRecipes,
//       sql`parent_recipes.id = parent_items.recipe_id AND parent_recipes.type = 'filling'`
//     )

//     .where(whereClause)
//     .groupBy(
//       RecipesTable.id,
//       RecipesTable.name,
//       RecipesTable.type,
//       RecipesTable.preparationCategory,
//       RecipesTable.defaultYieldBase,
//       RecipesTable.note,
//       RecipesTable.isArchived,
//       RecipesTable.createdAt,
//       RecipesTable.updatedAt,
//     )
//     .orderBy(desc(RecipesTable.updatedAt));

//   return rows;
// }


// actions/recipes/getRecipesByType.js
"use server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RecipesTable, ProductionBatchesTable, RecipeItemsTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { requireUser } from "@/lib/auth/session";
import { assertCanViewLocation } from "@/lib/auth/rbac";

export const getRecipesByType = withAction(async ({ location, type, category = null } = {}) => {
    // 1. Auth
    const user = await requireUser();

    // 3. RBAC
    assertCanViewLocation(user, location);

    // 4. Business logic
    const conditions = [
        eq(RecipesTable.location, location),
        eq(RecipesTable.type, type),
    ];
    if (category) conditions.push(eq(RecipesTable.category, category));

    // Алиасы для подзапроса "где используется этот рецепт"
    const parentItems = sql`${RecipeItemsTable} as parent_items`;
    const parentRecipes = sql`${RecipesTable} as parent_recipes`;

    const rows = await db
        .select({
            id: RecipesTable.id,
            name: RecipesTable.name,
            type: RecipesTable.type,
            location: RecipesTable.location,
            category: RecipesTable.category,
            defaultYieldBase: RecipesTable.defaultYieldBase,
            note: RecipesTable.note,
            isArchived: RecipesTable.isArchived,
            createdAt: RecipesTable.createdAt,
            updatedAt: RecipesTable.updatedAt,

            remainingBase:
                sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("remainingBase"),

            // Куда заготовка идёт как ингредиент (filling/dish-родители)
            usedInParents: sql`
                COALESCE(
                    jsonb_agg(DISTINCT parent_recipes.name)
                        FILTER (WHERE parent_recipes.name IS NOT NULL),
                    '[]'::jsonb
                )
            `.as("usedInParents"),
        })
        .from(RecipesTable)
        .leftJoin(
            ProductionBatchesTable,
            eq(ProductionBatchesTable.recipeId, RecipesTable.id),
        )
        .leftJoin(
            parentItems,
            sql`parent_items.child_recipe_id = ${RecipesTable.id} AND parent_items.ref_type = 'recipe'`,
        )
        .leftJoin(
            parentRecipes,
            sql`parent_recipes.id = parent_items.recipe_id AND parent_recipes.is_archived = false`,
        )
        .where(and(...conditions))
        .groupBy(
            RecipesTable.id,
            RecipesTable.name,
            RecipesTable.type,
            RecipesTable.location,
            RecipesTable.category,
            RecipesTable.defaultYieldBase,
            RecipesTable.note,
            RecipesTable.isArchived,
            RecipesTable.createdAt,
            RecipesTable.updatedAt,
        )
        .orderBy(desc(RecipesTable.updatedAt));

    return rows;
});