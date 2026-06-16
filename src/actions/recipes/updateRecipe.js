// actions/recipes/updateRecipe.js
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RecipesTable, RecipeItemsTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { ValidationError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";

import {
    updateRecipeSchema,
    getRecipeOrThrow,
    assertRecipeNameAvailable,
    buildRecipeItems,
    round6,
} from "./_shared";
import { RECIPE_CATEGORIES_BY_CONTEXT } from "@/drizzle/schemas/recipes/_enums";

export const updateRecipe = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(updateRecipeSchema, input);

    // 4. Business logic + audit
    const result = await db.transaction(async (tx) => {
        // 4.1 Получаем рецепт + проверки
        const recipe = await getRecipeOrThrow(tx, { id: data.recipeId });

        // 3. RBAC (после загрузки — знаем локацию)
        assertCanModifyLocation(user, recipe.location);

        if (recipe.isArchived) {
            throw new ValidationError("Нельзя редактировать архивный рецепт");
        }

        // Категория должна соответствовать type + location рецепта
        validateCategoryForRecipe(recipe, data.category);

        // Имя — проверка уникальности (исключая сам рецепт)
        if (data.name !== recipe.name) {
            await assertRecipeNameAvailable(tx, {
                name: data.name,
                type: recipe.type,
                location: recipe.location,
                excludeId: recipe.id,
            });
        }

        // 4.2 Обновление базовых полей
        const [updated] = await tx
            .update(RecipesTable)
            .set({
                name: data.name,
                category: recipe.type === "filling" ? null : data.category,
                defaultYieldBase: String(round6(data.defaultYieldBase)),
                note: data.note ?? null,
                updatedAt: new Date(),
            })
            .where(eq(RecipesTable.id, recipe.id))
            .returning();

        // 4.3 Полная замена items (старые → удаляем, новые → создаём)
        // Подрецепты, которые были созданы ранее через complexGroups, НЕ трогаем —
        // они живут отдельной жизнью (могли уже произвестись).
        await tx.delete(RecipeItemsTable).where(eq(RecipeItemsTable.recipeId, recipe.id));

        const subRecipes = await buildRecipeItems(tx, {
            parentRecipeId: recipe.id,
            location: recipe.location,
            simpleItems: data.simpleItems,
            complexGroups: data.complexGroups,
            user,
        });

        // 4.4 Audit
        await logActivity({
            tx,
            user,
            action: "update",
            entity: "recipe",
            entityId: recipe.id,
            location: recipe.location,
            description: `Обновлён рецепт «${updated.name}»`,
            metadata: {
                before: {
                    name: recipe.name,
                    category: recipe.category,
                    defaultYieldBase: recipe.defaultYieldBase,
                },
                after: {
                    name: updated.name,
                    category: updated.category,
                    defaultYieldBase: updated.defaultYieldBase,
                },
                newSubRecipes: subRecipes.map((s) => ({ id: s.id, name: s.name })),
            },
        });

        return { recipe: updated, subRecipes };
    });

    // 5. Revalidate
    revalidatePath(`/${result.recipe.location}`);
    revalidatePath("/admin");

    return result;
});

// ─────────────────────────────────────────────────────────────────────────────
function validateCategoryForRecipe(recipe, category) {
    if (recipe.type === "filling") {
        if (category) {
            throw new ValidationError("У начинок не должно быть категории");
        }
        return;
    }
    if (!category) {
        throw new ValidationError("Категория обязательна");
    }
    const allowed = RECIPE_CATEGORIES_BY_CONTEXT[`${recipe.location}:${recipe.type}`] ?? [];
    if (!allowed.includes(category)) {
        throw new ValidationError("Категория не подходит для этого типа и локации");
    }
}