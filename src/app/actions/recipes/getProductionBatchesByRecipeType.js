"use server";

import { db } from "@/drizzle/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";

export async function getProductionBatchesByRecipeType(recipeType) {
    const rows = await db
        .select({
            batchId: ProductionBatchesTable.id,
            recipeId: ProductionBatchesTable.recipeId,
            recipeName: RecipesTable.name,
            recipeType: RecipesTable.type,

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
        .where(eq(RecipesTable.type, recipeType))
        .orderBy(desc(ProductionBatchesTable.producedAt));

    return rows;
}
