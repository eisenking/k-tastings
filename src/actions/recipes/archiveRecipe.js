// actions/recipes/archiveRecipe.js
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { RecipesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { ConflictError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";

import {
    archiveRecipeSchema,
    getRecipeOrThrow,
    findActiveUsages,
} from "./_shared";

export const archiveRecipe = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(archiveRecipeSchema, input);

    // 4. Business logic + audit
    const result = await db.transaction(async (tx) => {
        // 4.1 Получаем рецепт + RBAC
        const recipe = await getRecipeOrThrow(tx, { id: data.recipeId });
        assertCanModifyLocation(user, recipe.location);

        if (recipe.isArchived === data.archive) {
            // Идемпотентность: уже в нужном состоянии — просто возвращаем
            return recipe;
        }

        // 4.2 При архивации — проверяем активные использования
        if (data.archive) {
            const usages = await findActiveUsages(tx, { recipeId: recipe.id });
            if (usages.length > 0) {
                const names = usages.map((u) => `«${u.name}»`).join(", ");
                throw new ConflictError(
                    `Нельзя архивировать: рецепт используется в ${names}`,
                );
            }
        }

        // 4.3 Обновление флага
        const [updated] = await tx
            .update(RecipesTable)
            .set({ isArchived: data.archive, updatedAt: new Date() })
            .where(eq(RecipesTable.id, recipe.id))
            .returning();

        // 4.4 Audit
        await logActivity({
            tx,
            user,
            action: data.archive ? "archive" : "unarchive",
            entity: "recipe",
            entityId: recipe.id,
            location: recipe.location,
            description: data.archive
                ? `Архивирован рецепт «${recipe.name}»`
                : `Разархивирован рецепт «${recipe.name}»`,
        });

        return updated;
    });

    // 5. Revalidate
    revalidatePath(`/${result.location}`);
    revalidatePath("/admin");

    return result;
});