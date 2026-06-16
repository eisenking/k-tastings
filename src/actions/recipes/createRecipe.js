// "use server";

// import { db } from "@/drizzle/db";
// import { RecipesTable, RecipeItemsTable } from "@/drizzle/schema";
// import { sql } from "drizzle-orm";
// import { auth } from "@/lib/auth"; // подстрой под свой BetterAuth хелпер
// import { headers } from "next/headers";

// function toNum(v, fallback = 0) {
//     const n = Number(String(v).replace(",", "."));
//     return Number.isFinite(n) ? n : fallback;
// }

// export async function createRecipe(payload) {
//     const session = await auth.api.getSession({
//         headers: await headers(),
//     });

//     if (!session?.user) {
//         throw new Error("Unauthorized");
//     }

//     const userId = session.user.id;
//     const userName = session.user.name || session.user.email || "user";

//     const {
//         name,
//         type,
//         defaultYieldBase,
//         note,
//         simpleItems = [],
//         complexGroups = [],
//     } = payload;

//     if (!name || !type) {
//         throw new Error("name/type required");
//     }

//     const yieldBase = toNum(defaultYieldBase, 1000);

//     return await db.transaction(async (tx) => {
//         // 1) Главный рецепт
//         const [mainRecipe] = await tx
//             .insert(RecipesTable)
//             .values({
//                 name,
//                 type,
//                 defaultYieldBase: String(yieldBase),
//                 note: note || null,
//                 userId,
//                 userName,
//             })
//             .returning();

//         // 2) Сложные ингредиенты -> подрецепты preparation
//         for (const g of complexGroups) {
//             const groupName = (g?.name || "").trim();
//             const category = g?.category || null;
//             const items = Array.isArray(g?.items) ? g.items : [];

//             if (!groupName || !category || items.length === 0) continue;

//             const sumBase = items.reduce((acc, it) => acc + toNum(it.amountBase, 0), 0);

//             const [sub] = await tx
//                 .insert(RecipesTable)
//                 .values({
//                     name: groupName,
//                     type: "preparation",
//                     preparationCategory: category,
//                     defaultYieldBase: String(sumBase > 0 ? sumBase : 0),
//                     note: null,
//                     userId,
//                     userName,
//                 })
//                 .returning();

//             // items подрецепта: только продукты склада 1
//             for (const it of items) {
//                 if (!it?.productId) continue;
//                 const amt = toNum(it.amountBase, 0);
//                 if (amt <= 0) continue;

//                 await tx.insert(RecipeItemsTable).values({
//                     recipeId: sub.id,
//                     refType: "product",
//                     productId: it.productId,
//                     childRecipeId: null,
//                     amountBase: String(amt),
//                     groupName: null,
//                     sortOrder: null,
//                     userId,
//                     userName,
//                 });
//             }

//             // В главный рецепт добавляем ссылку на подрецепт (amount = сумма)
//             if (sumBase > 0) {
//                 await tx.insert(RecipeItemsTable).values({
//                     recipeId: mainRecipe.id,
//                     refType: "recipe",
//                     productId: null,
//                     childRecipeId: sub.id,
//                     amountBase: String(sumBase),
//                     groupName: null,
//                     sortOrder: null,
//                     userId,
//                     userName,
//                 });
//             }
//         }

//         // 3) Простые ингредиенты главного рецепта (продукты)
//         for (const it of simpleItems) {
//             if (!it?.productId) continue;
//             const amt = toNum(it.amountBase, 0);
//             if (amt <= 0) continue;

//             await tx.insert(RecipeItemsTable).values({
//                 recipeId: mainRecipe.id,
//                 refType: "product",
//                 productId: it.productId,
//                 childRecipeId: null,
//                 amountBase: String(amt),
//                 groupName: null,
//                 sortOrder: null,
//                 userId,
//                 userName,
//             });
//         }

//         return mainRecipe;
//     });
// }

// actions/recipes/createRecipe.js
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/drizzle/db";
import { RecipesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";

import {
    createRecipeSchema,
    assertRecipeNameAvailable,
    buildRecipeItems,
    round6,
} from "./_shared";

export const createRecipe = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(createRecipeSchema, input);

    // 3. RBAC
    assertCanModifyLocation(user, data.location);

    // 4. Business logic + audit
    const result = await db.transaction(async (tx) => {
        // 4.1 Уникальность имени в рамках (type + location)
        await assertRecipeNameAvailable(tx, {
            name: data.name,
            type: data.type,
            location: data.location,
        });

        // 4.2 Создание главного рецепта
        const [recipe] = await tx
            .insert(RecipesTable)
            .values({
                name: data.name,
                type: data.type,
                location: data.location,
                category: data.type === "filling" ? null : data.category,
                defaultYieldBase: String(round6(data.defaultYieldBase)),
                note: data.note ?? null,
                userId: user.id,
            })
            .returning();

        // 4.3 Items + автоматически созданные подрецепты
        const subRecipes = await buildRecipeItems(tx, {
            parentRecipeId: recipe.id,
            location: data.location,
            simpleItems: data.simpleItems,
            complexGroups: data.complexGroups,
            user,
        });

        // 4.4 Audit
        await logActivity({
            tx,
            user,
            action: "create",
            entity: "recipe",
            entityId: recipe.id,
            location: recipe.location,
            description: `Создан рецепт «${recipe.name}» (${recipe.type})`,
            metadata: {
                type: recipe.type,
                category: recipe.category,
                defaultYieldBase: recipe.defaultYieldBase,
                simpleItemsCount: data.simpleItems.length,
                complexGroupsCount: data.complexGroups.length,
                createdSubRecipes: subRecipes.map((s) => ({ id: s.id, name: s.name })),
            },
        });

        // Аудит на каждый созданный подрецепт — отдельной записью
        for (const sub of subRecipes) {
            await logActivity({
                tx,
                user,
                action: "create",
                entity: "recipe",
                entityId: sub.id,
                location: sub.location,
                description: `Создана заготовка «${sub.name}» вместе с рецептом «${recipe.name}»`,
                metadata: { parentRecipeId: recipe.id, parentName: recipe.name },
            });
        }

        return { recipe, subRecipes };
    });

    // 5. Revalidate
    revalidatePath(`/${data.location}`);
    revalidatePath("/admin");

    return result;
});