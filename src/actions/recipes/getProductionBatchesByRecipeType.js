
// "use server";

// import { db } from "@/drizzle/db";
// import { and, desc, eq, gt } from "drizzle-orm";
// import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";

// export async function getProductionBatchesByRecipeType(recipeType) {
//     const rows = await db
//         .select({
//             batchId: ProductionBatchesTable.id,
//             recipeId: ProductionBatchesTable.recipeId,
//             recipeName: RecipesTable.name,
//             recipeType: RecipesTable.type,

//             preparationCategory: RecipesTable.preparationCategory,

//             producedBase: ProductionBatchesTable.producedBase,
//             remainingBase: ProductionBatchesTable.remainingBase,
//             totalCost: ProductionBatchesTable.totalCost,
//             unitCostBase: ProductionBatchesTable.unitCostBase,

//             producedAt: ProductionBatchesTable.producedAt,
//             expirationDate: ProductionBatchesTable.expirationDate,

//             userName: ProductionBatchesTable.userName,
//         })
//         .from(ProductionBatchesTable)
//         .innerJoin(RecipesTable, eq(RecipesTable.id, ProductionBatchesTable.recipeId))
//         .where(
//             and(
//                 eq(RecipesTable.type, recipeType),
//                 gt(ProductionBatchesTable.remainingBase, "0")
//             )
//         )
//         .orderBy(desc(ProductionBatchesTable.producedAt));

//     return rows;
// }

// actions/recipes/getProductionBatchesByRecipeType.js
"use server";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { requireUser } from "@/lib/auth/session";
import { assertCanViewLocation } from "@/lib/auth/rbac";

/**
 * Список произведённых партий по типу рецепта в локации.
 * Опционально — только с остатком > 0 (для подбора FIFO в UI).
 */
export const getProductionBatchesByRecipeType = withAction(
    async ({ location, type, category = null, onlyWithRemaining = false } = {}) => {
        // 1. Auth
        const user = await requireUser();

        // 3. RBAC
        assertCanViewLocation(user, location);

        // 4. Business logic
        const conditions = [
            eq(ProductionBatchesTable.location, location),
            eq(RecipesTable.type, type),
        ];
        if (category) conditions.push(eq(RecipesTable.category, category));
        if (onlyWithRemaining) conditions.push(gt(ProductionBatchesTable.remainingBase, "0"));

        const rows = await db
            .select({
                id: ProductionBatchesTable.id,
                recipeId: ProductionBatchesTable.recipeId,
                recipeName: RecipesTable.name,
                recipeType: RecipesTable.type,
                recipeCategory: RecipesTable.category,
                location: ProductionBatchesTable.location,

                producedBase: ProductionBatchesTable.producedBase,
                remainingBase: ProductionBatchesTable.remainingBase,
                totalCost: ProductionBatchesTable.totalCost,
                unitCostBase: ProductionBatchesTable.unitCostBase,

                producedAt: ProductionBatchesTable.producedAt,
                expirationDate: ProductionBatchesTable.expirationDate,
                note: ProductionBatchesTable.note,
            })
            .from(ProductionBatchesTable)
            .innerJoin(RecipesTable, eq(RecipesTable.id, ProductionBatchesTable.recipeId))
            .where(and(...conditions))
            .orderBy(desc(ProductionBatchesTable.producedAt));

        return rows;
    },
);