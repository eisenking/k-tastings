"use server";

import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RecipesTable, RecipeItemsTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { requireUser } from "@/lib/auth/session";
import { parseInput } from "@/lib/utils/validation";
import { assertCanViewLocation } from "@/lib/auth/rbac";
import { LOCATIONS_LIST } from "@/lib/constants/roles";
import { ValidationError } from "@/lib/utils/errors";

const schema = z.object({
    location: z.enum(LOCATIONS_LIST),
    fillingIds: z.array(z.string().uuid()).default([]),
});

/**
 * Граф рецептов для планирования производства:
 * начинки + все вложенные заготовки (BFS по childRecipeId).
 */
export const getRecipeGraphForFillings = withAction(async (input) => {
    const user = await requireUser();
    const { location, fillingIds } = parseInput(schema, input);
    assertCanViewLocation(user, location);

    const start = fillingIds.filter(Boolean);
    if (start.length === 0) {
        return { recipes: [], items: [] };
    }

    const rootRows = await db
        .select({ id: RecipesTable.id, type: RecipesTable.type, location: RecipesTable.location })
        .from(RecipesTable)
        .where(inArray(RecipesTable.id, start));

    for (const r of rootRows) {
        if (r.location !== location || r.type !== "filling") {
            throw new ValidationError("Некорректный список начинок для локации");
        }
    }

    const seen = new Set();
    const queue = [...start];
    const allRecipeIds = [];

    while (queue.length) {
        const id = queue.shift();
        if (!id || seen.has(id)) continue;

        seen.add(id);
        allRecipeIds.push(id);

        const childItems = await db
            .select({
                childRecipeId: RecipeItemsTable.childRecipeId,
                refType: RecipeItemsTable.refType,
            })
            .from(RecipeItemsTable)
            .where(eq(RecipeItemsTable.recipeId, id));

        for (const it of childItems) {
            if (
                it?.refType === "recipe" &&
                it?.childRecipeId &&
                !seen.has(it.childRecipeId)
            ) {
                queue.push(it.childRecipeId);
            }
        }
    }

    const recipes = await db
        .select()
        .from(RecipesTable)
        .where(
            and(
                inArray(RecipesTable.id, allRecipeIds),
                eq(RecipesTable.location, location),
            ),
        );

    const items = await db
        .select()
        .from(RecipeItemsTable)
        .where(inArray(RecipeItemsTable.recipeId, allRecipeIds));

    return { recipes, items };
});
