"use server";

import { db } from "@/drizzle/db";
import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";
import { sql, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

export async function getFillingStockMap() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Берём только начинки (recipe.type = "filling")
    const rows = await db
        .select({
            recipeId: ProductionBatchesTable.recipeId,
            remaining: sql`coalesce(sum(${ProductionBatchesTable.remainingBase}), 0)`.as("remaining"),
        })
        .from(ProductionBatchesTable)
        .innerJoin(RecipesTable, eq(RecipesTable.id, ProductionBatchesTable.recipeId))
        .where(eq(ProductionBatchesTable.userId, userId))
        .where(eq(RecipesTable.type, "filling"))
        .groupBy(ProductionBatchesTable.recipeId);

    const map = {};
    for (const r of rows) {
        map[r.recipeId] = toNum(r.remaining, 0);
    }

    return map; // { [fillingRecipeId]: grams }
}