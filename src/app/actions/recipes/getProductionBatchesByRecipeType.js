// "use server";
// import { db } from "@/drizzle/db";
// import { and, desc, eq, gt } from "drizzle-orm";
// import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";

// export async function getProductionBatchesByRecipeType(recipeType) {
//   const rows = await db
//     .select({
//       batchId: ProductionBatchesTable.id,
//       recipeId: ProductionBatchesTable.recipeId,
//       recipeName: RecipesTable.name,
//       recipeType: RecipesTable.type,

//       producedBase: ProductionBatchesTable.producedBase,
//       remainingBase: ProductionBatchesTable.remainingBase,
//       totalCost: ProductionBatchesTable.totalCost,
//       unitCostBase: ProductionBatchesTable.unitCostBase,

//       producedAt: ProductionBatchesTable.producedAt,
//       expirationDate: ProductionBatchesTable.expirationDate,

//       userName: ProductionBatchesTable.userName,
//     })
//     .from(ProductionBatchesTable)
//     .innerJoin(RecipesTable, eq(RecipesTable.id, ProductionBatchesTable.recipeId))
//     .where(
//       and(
//         eq(RecipesTable.type, recipeType),
//         gt(ProductionBatchesTable.remainingBase, "0")
//       )
//     )
//     .orderBy(desc(ProductionBatchesTable.producedAt));

//   return rows;
// }

"use server";

import { db } from "@/drizzle/db";
import { and, desc, eq, gt } from "drizzle-orm";
import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";

export async function getProductionBatchesByRecipeType(recipeType) {
    const rows = await db
        .select({
            batchId: ProductionBatchesTable.id,
            recipeId: ProductionBatchesTable.recipeId,
            recipeName: RecipesTable.name,
            recipeType: RecipesTable.type,

            preparationCategory: RecipesTable.preparationCategory,

            producedBase: ProductionBatchesTable.producedBase,
            remainingBase: ProductionBatchesTable.remainingBase,
            totalCost: ProductionBatchesTable.totalCost,
            unitCostBase: ProductionBatchesTable.unitCostBase,

            producedAt: ProductionBatchesTable.producedAt,
            expirationDate: ProductionBatchesTable.expirationDate,

            userName: ProductionBatchesTable.userName,
        })
        .from(ProductionBatchesTable)
        .innerJoin(RecipesTable, eq(RecipesTable.id, ProductionBatchesTable.recipeId))
        .where(
            and(
                eq(RecipesTable.type, recipeType),
                gt(ProductionBatchesTable.remainingBase, "0")
            )
        )
        .orderBy(desc(ProductionBatchesTable.producedAt));

    return rows;
}