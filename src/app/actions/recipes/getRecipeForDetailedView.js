// "use server";

// import { db } from "@/drizzle/db";
// import { eq, sql, inArray } from "drizzle-orm";
// import {
//     RecipesTable,
//     RecipeItemsTable,
//     ProductionBatchesTable,
//     ProductsTable,
//     StockMovementsTable,
// } from "@/drizzle/schema";

// /**
//  * Возвращает:
//  * - recipe (id, name, type, defaultYieldBase)
//  * - items: [{ refType, amountBase, product?, childRecipe?, availableBase }]
//  *
//  * availableBase:
//  * - product: считаем по движениям склада 1: SUM(Приход) - SUM(Списание) - SUM(Производство)
//  * - recipe: считаем по production_batches.remainingBase
//  */
// export async function getRecipeForDetailedView(recipeId) {
//     const [recipe] = await db
//         .select({
//             id: RecipesTable.id,
//             name: RecipesTable.name,
//             type: RecipesTable.type,
//             defaultYieldBase: RecipesTable.defaultYieldBase,
//         })
//         .from(RecipesTable)
//         .where(eq(RecipesTable.id, recipeId));

//     if (!recipe) {
//         throw new Error("Recipe not found");
//     }

//     const items = await db
//         .select({
//             id: RecipeItemsTable.id,
//             refType: RecipeItemsTable.refType,
//             amountBase: RecipeItemsTable.amountBase,

//             productId: RecipeItemsTable.productId,
//             childRecipeId: RecipeItemsTable.childRecipeId,

//             productName: ProductsTable.name,
//             productType: ProductsTable.type,

//             childRecipeName: sql`child_recipe.name`.as("childRecipeName"),
//             childRecipeType: sql`child_recipe.type`.as("childRecipeType"),
//         })
//         .from(RecipeItemsTable)
//         .leftJoin(ProductsTable, eq(ProductsTable.id, RecipeItemsTable.productId))
//         .leftJoin(
//             sql`${RecipesTable} as child_recipe`,
//             sql`child_recipe.id = ${RecipeItemsTable.childRecipeId}`,
//         )
//         .where(eq(RecipeItemsTable.recipeId, recipeId));

//     // 1) Availability for products (склад 1) — по движениям
//     const productIds = items
//         .filter((i) => i.refType === "product" && i.productId)
//         .map((i) => i.productId);

//     let productAvailMap = new Map();
//     if (productIds.length > 0) {
//         const productAvail = await db
//             .select({
//                 productId: StockMovementsTable.productId,
//                 availableBase: sql`
//                     COALESCE(SUM(
//                         CASE
//                             WHEN ${StockMovementsTable.type} = 'Приход' THEN ${StockMovementsTable.quantityBase}
//                             WHEN ${StockMovementsTable.type} = 'Списание' THEN -${StockMovementsTable.quantityBase}
//                             WHEN ${StockMovementsTable.type} = 'Производство' THEN -${StockMovementsTable.quantityBase}
//                             ELSE 0
//                         END
//                     ), 0)
//                 `.as("availableBase"),
//             })
//             .from(StockMovementsTable)
//             .where(inArray(StockMovementsTable.productId, productIds))
//             .groupBy(StockMovementsTable.productId);

//         productAvailMap = new Map(productAvail.map((r) => [r.productId, r.availableBase]));
//     }

//     // 2) Availability for child recipes (склад 2) — по партиям производства
//     const childRecipeIds = items
//         .filter((i) => i.refType === "recipe" && i.childRecipeId)
//         .map((i) => i.childRecipeId);

//     let recipeAvailMap = new Map();
//     if (childRecipeIds.length > 0) {
//         const recipeAvail = await db
//             .select({
//                 recipeId: ProductionBatchesTable.recipeId,
//                 availableBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("availableBase"),
//             })
//             .from(ProductionBatchesTable)
//             .where(inArray(ProductionBatchesTable.recipeId, childRecipeIds))
//             .groupBy(ProductionBatchesTable.recipeId);

//         recipeAvailMap = new Map(recipeAvail.map((r) => [r.recipeId, r.availableBase]));
//     }

//     const normalized = items.map((i) => {
//         const availableBase =
//             i.refType === "product"
//                 ? productAvailMap.get(i.productId) ?? "0"
//                 : recipeAvailMap.get(i.childRecipeId) ?? "0";

//         return {
//             id: i.id,
//             refType: i.refType,
//             amountBase: i.amountBase,

//             product: i.refType === "product"
//                 ? {
//                     id: i.productId,
//                     name: i.productName,
//                     type: i.productType,
//                 }
//                 : null,

//             childRecipe: i.refType === "recipe"
//                 ? {
//                     id: i.childRecipeId,
//                     name: i.childRecipeName,
//                     type: i.childRecipeType,
//                 }
//                 : null,

//             availableBase,
//         };
//     });

//     return {
//         recipe,
//         items: normalized,
//     };
// }


"use server";

import { db } from "@/drizzle/db";
import { eq, sql, inArray } from "drizzle-orm";
import {
    RecipesTable,
    RecipeItemsTable,
    ProductionBatchesTable,
    ProductsTable,
    StockMovementsTable,
} from "@/drizzle/schema";

export async function getRecipeForDetailedView(recipeId) {
    const [recipe] = await db
        .select({
            id: RecipesTable.id,
            name: RecipesTable.name,
            type: RecipesTable.type,
            defaultYieldBase: RecipesTable.defaultYieldBase,
        })
        .from(RecipesTable)
        .where(eq(RecipesTable.id, recipeId));

    if (!recipe) throw new Error("Recipe not found");

    const items = await db
        .select({
            id: RecipeItemsTable.id,
            refType: RecipeItemsTable.refType,
            amountBase: RecipeItemsTable.amountBase,

            productId: RecipeItemsTable.productId,
            childRecipeId: RecipeItemsTable.childRecipeId,

            productName: ProductsTable.name,
            productCategory: ProductsTable.category,

            childRecipeName: sql`child_recipe.name`.as("childRecipeName"),
            childRecipeType: sql`child_recipe.type`.as("childRecipeType"),
        })
        .from(RecipeItemsTable)
        .leftJoin(ProductsTable, eq(ProductsTable.id, RecipeItemsTable.productId))
        .leftJoin(
            sql`${RecipesTable} as child_recipe`,
            sql`child_recipe.id = ${RecipeItemsTable.childRecipeId}`,
        )
        .where(eq(RecipeItemsTable.recipeId, recipeId));

    // availability products (склад 1) — amountBase
    const productIds = items
        .filter((i) => i.refType === "product" && i.productId)
        .map((i) => i.productId);

    let productAvailMap = new Map();
    if (productIds.length > 0) {
        const productAvail = await db
            .select({
                productId: StockMovementsTable.productId,
                availableBase: sql`
                    COALESCE(SUM(
                        CASE
                            WHEN ${StockMovementsTable.type} = 'Приход' THEN ${StockMovementsTable.amountBase}
                            WHEN ${StockMovementsTable.type} = 'Списание' THEN -${StockMovementsTable.amountBase}
                            WHEN ${StockMovementsTable.type} = 'Производство' THEN -${StockMovementsTable.amountBase}
                            ELSE 0
                        END
                    ), 0)
                `.as("availableBase"),
            })
            .from(StockMovementsTable)
            .where(inArray(StockMovementsTable.productId, productIds))
            .groupBy(StockMovementsTable.productId);

        productAvailMap = new Map(productAvail.map((r) => [r.productId, r.availableBase]));
    }

    // availability child recipes (склад 2) — remainingBase
    const childRecipeIds = items
        .filter((i) => i.refType === "recipe" && i.childRecipeId)
        .map((i) => i.childRecipeId);

    let recipeAvailMap = new Map();
    if (childRecipeIds.length > 0) {
        const recipeAvail = await db
            .select({
                recipeId: ProductionBatchesTable.recipeId,
                availableBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("availableBase"),
            })
            .from(ProductionBatchesTable)
            .where(inArray(ProductionBatchesTable.recipeId, childRecipeIds))
            .groupBy(ProductionBatchesTable.recipeId);

        recipeAvailMap = new Map(recipeAvail.map((r) => [r.recipeId, r.availableBase]));
    }

    const normalized = items.map((i) => {
        const availableBase =
            i.refType === "product"
                ? productAvailMap.get(i.productId) ?? "0"
                : recipeAvailMap.get(i.childRecipeId) ?? "0";

        return {
            id: i.id,
            refType: i.refType,
            amountBase: i.amountBase,

            product: i.refType === "product"
                ? {
                    id: i.productId,
                    name: i.productName,
                    category: i.productCategory,
                }
                : null,

            childRecipe: i.refType === "recipe"
                ? {
                    id: i.childRecipeId,
                    name: i.childRecipeName,
                    type: i.childRecipeType,
                }
                : null,

            availableBase,
        };
    });

    return { recipe, items: normalized };
}
