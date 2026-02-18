"use server";

import { db } from "@/drizzle/db";
import { RecipesTable, RecipeItemsTable } from "@/drizzle/schema";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth"; // подстрой под свой BetterAuth хелпер
import { headers } from "next/headers";

function toNum(v, fallback = 0) {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

export async function createRecipe(payload) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const userName = session.user.name || session.user.email || "user";

    const {
        name,
        type,
        defaultYieldBase,
        steps,
        note,
        simpleItems = [],
        complexGroups = [],
    } = payload;

    if (!name || !type) {
        throw new Error("name/type required");
    }

    const yieldBase = toNum(defaultYieldBase, 1000);

    return await db.transaction(async (tx) => {
        // 1) Главный рецепт
        const [mainRecipe] = await tx
            .insert(RecipesTable)
            .values({
                name,
                type,
                defaultYieldBase: String(yieldBase),
                steps: steps || null,
                note: note || null,
                userId,
                userName,
            })
            .returning();

        // 2) Сложные ингредиенты -> подрецепты preparation
        for (const g of complexGroups) {
            const groupName = (g?.name || "").trim();
            const category = g?.category || null;
            const items = Array.isArray(g?.items) ? g.items : [];

            if (!groupName || !category || items.length === 0) continue;

            const sumBase = items.reduce((acc, it) => acc + toNum(it.amountBase, 0), 0);

            const [sub] = await tx
                .insert(RecipesTable)
                .values({
                    name: groupName,
                    type: "preparation",
                    preparationCategory: category,
                    defaultYieldBase: String(sumBase > 0 ? sumBase : 0),
                    steps: null,
                    note: null,
                    userId,
                    userName,
                })
                .returning();

            // items подрецепта: только продукты склада 1
            for (const it of items) {
                if (!it?.productId) continue;
                const amt = toNum(it.amountBase, 0);
                if (amt <= 0) continue;

                await tx.insert(RecipeItemsTable).values({
                    recipeId: sub.id,
                    refType: "product",
                    productId: it.productId,
                    childRecipeId: null,
                    amountBase: String(amt),
                    groupName: null,
                    sortOrder: null,
                    userId,
                    userName,
                });
            }

            // В главный рецепт добавляем ссылку на подрецепт (amount = сумма)
            if (sumBase > 0) {
                await tx.insert(RecipeItemsTable).values({
                    recipeId: mainRecipe.id,
                    refType: "recipe",
                    productId: null,
                    childRecipeId: sub.id,
                    amountBase: String(sumBase),
                    groupName: null,
                    sortOrder: null,
                    userId,
                    userName,
                });
            }
        }

        // 3) Простые ингредиенты главного рецепта (продукты)
        for (const it of simpleItems) {
            if (!it?.productId) continue;
            const amt = toNum(it.amountBase, 0);
            if (amt <= 0) continue;

            await tx.insert(RecipeItemsTable).values({
                recipeId: mainRecipe.id,
                refType: "product",
                productId: it.productId,
                childRecipeId: null,
                amountBase: String(amt),
                groupName: null,
                sortOrder: null,
                userId,
                userName,
            });
        }

        return mainRecipe;
    });
}
