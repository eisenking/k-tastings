"use server";

import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RecipesTable, ProductionBatchesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { requireUser } from "@/lib/auth/session";
import { parseInput } from "@/lib/utils/validation";
import { assertCanViewLocation } from "@/lib/auth/rbac";
import { LOCATIONS_LIST } from "@/lib/constants/roles";

const schema = z.object({
    location: z.enum(LOCATIONS_LIST),
});

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

/** Остатки начинок (склад 3) по локации: { [fillingRecipeId]: grams } */
export const getFillingStockMap = withAction(async (input) => {
    const user = await requireUser();
    const { location } = parseInput(schema, input);
    assertCanViewLocation(user, location);

    const rows = await db
        .select({
            recipeId: ProductionBatchesTable.recipeId,
            remaining: sql`coalesce(sum(${ProductionBatchesTable.remainingBase}), 0)`.as(
                "remaining",
            ),
        })
        .from(ProductionBatchesTable)
        .innerJoin(RecipesTable, eq(RecipesTable.id, ProductionBatchesTable.recipeId))
        .where(
            and(
                eq(ProductionBatchesTable.location, location),
                eq(RecipesTable.location, location),
                eq(RecipesTable.type, "filling"),
            ),
        )
        .groupBy(ProductionBatchesTable.recipeId);

    const map = {};
    for (const r of rows) {
        map[r.recipeId] = toNum(r.remaining, 0);
    }

    return map;
});
