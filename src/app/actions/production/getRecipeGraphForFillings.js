"use server";

import { db } from "@/drizzle/db";
import { RecipesTable, RecipeItemsTable } from "@/drizzle/schema";
import { inArray } from "drizzle-orm";

export async function getRecipeGraphForFillings({ fillingIds }) {
    const start = Array.isArray(fillingIds) ? fillingIds.filter(Boolean) : [];
    if (start.length === 0) {
        return { recipes: [], items: [] };
    }

    const seen = new Set();
    const queue = [...start];

    const allRecipeIds = [];

    while (queue.length) {
        const id = queue.shift();
        if (!id || seen.has(id)) continue;

        seen.add(id);
        allRecipeIds.push(id);

        // берём items этого рецепта
        const items = await db
            .select({
                childRecipeId: RecipeItemsTable.childRecipeId,
                refType: RecipeItemsTable.refType,
            })
            .from(RecipeItemsTable)
            .where(inArray(RecipeItemsTable.recipeId, [id]));

        for (const it of items) {
            if (it?.refType === "recipe" && it?.childRecipeId && !seen.has(it.childRecipeId)) {
                queue.push(it.childRecipeId);
            }
        }
    }

    const recipes = await db
        .select()
        .from(RecipesTable)
        .where(inArray(RecipesTable.id, allRecipeIds));

    const items = await db
        .select()
        .from(RecipeItemsTable)
        .where(inArray(RecipeItemsTable.recipeId, allRecipeIds));

    return { recipes, items };
}