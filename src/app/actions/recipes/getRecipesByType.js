"use server";

import { db } from "@/drizzle/db";
import { eq, sql, desc } from "drizzle-orm";
import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";

export async function getRecipesByType(type) {
    const rows = await db
        .select({
            id: RecipesTable.id,
            name: RecipesTable.name,
            type: RecipesTable.type,
            preparationCategory: RecipesTable.preparationCategory,
            defaultYieldBase: RecipesTable.defaultYieldBase,
            steps: RecipesTable.steps,
            note: RecipesTable.note,
            isArchived: RecipesTable.isArchived,
            createdAt: RecipesTable.createdAt,
            updatedAt: RecipesTable.updatedAt,

            // суммарный остаток по партиям (склад 2/3)
            remainingBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("remainingBase"),
        })
        .from(RecipesTable)
        .leftJoin(ProductionBatchesTable, eq(ProductionBatchesTable.recipeId, RecipesTable.id))
        .where(eq(RecipesTable.type, type))
        .groupBy(
            RecipesTable.id,
            RecipesTable.name,
            RecipesTable.type,
            RecipesTable.preparationCategory,
            RecipesTable.defaultYieldBase,
            RecipesTable.steps,
            RecipesTable.note,
            RecipesTable.isArchived,
            RecipesTable.createdAt,
            RecipesTable.updatedAt,
        )
        .orderBy(desc(RecipesTable.updatedAt));

    return rows;
}