"use server";

import { db } from "@/drizzle/db";
import { eq, inArray, sql } from "drizzle-orm";
import {
    RecipesTable,
    RecipeItemsTable,
    ProductionBatchesTable,
    ProductsTable,
    StockMovementsTable,
} from "@/drizzle/schema";

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Возвращает:
 * recipe: { id, name, type, defaultYieldBase }
 * items: [
 *   product item:
 *     { refType:'product', amountBase, availableBase, product:{id,name,type} }
 *   recipe item (заготовка):
 *     {
 *       refType:'recipe',
 *       amountBase,
 *       availableBase,
 *       childRecipe:{id,name,type,defaultYieldBase},
 *       childItems:[ { amountBase, availableBase, product:{...} } ] // состав заготовки (product only)
 *     }
 * ]
 */
export async function getRecipeTreeForDetailedView(recipeId) {
    const [recipe] = await db
        .select({
            id: RecipesTable.id,
            name: RecipesTable.name,
            type: RecipesTable.type,
            defaultYieldBase: RecipesTable.defaultYieldBase,
        })
        .from(RecipesTable)
        .where(eq(RecipesTable.id, recipeId));

    if (!recipe) {
        throw new Error("Recipe not found");
    }

    // Главный состав
    const items = await db
        .select({
            id: RecipeItemsTable.id,
            refType: RecipeItemsTable.refType,
            amountBase: RecipeItemsTable.amountBase,

            productId: RecipeItemsTable.productId,
            childRecipeId: RecipeItemsTable.childRecipeId,

            productName: ProductsTable.name,
            productType: ProductsTable.type,

            childRecipeName: sql`child_recipe.name`.as("childRecipeName"),
            childRecipeType: sql`child_recipe.type`.as("childRecipeType"),
            childDefaultYieldBase: sql`child_recipe.default_yield_base`.as("childDefaultYieldBase"),
        })
        .from(RecipeItemsTable)
        .leftJoin(ProductsTable, eq(ProductsTable.id, RecipeItemsTable.productId))
        .leftJoin(
            sql`${RecipesTable} as child_recipe`,
            sql`child_recipe.id = ${RecipeItemsTable.childRecipeId}`,
        )
        .where(eq(RecipeItemsTable.recipeId, recipeId));

    const productIdsTop = items
        .filter((i) => i.refType === "product" && i.productId)
        .map((i) => i.productId);

    const childRecipeIds = items
        .filter((i) => i.refType === "recipe" && i.childRecipeId)
        .map((i) => i.childRecipeId);

    // Состав подрецептов (только продукты)
    let childItemsRows = [];
    if (childRecipeIds.length > 0) {
        childItemsRows = await db
            .select({
                recipeId: RecipeItemsTable.recipeId,
                productId: RecipeItemsTable.productId,
                amountBase: RecipeItemsTable.amountBase,
                productName: ProductsTable.name,
                productType: ProductsTable.type,
            })
            .from(RecipeItemsTable)
            .innerJoin(ProductsTable, eq(ProductsTable.id, RecipeItemsTable.productId))
            .where(inArray(RecipeItemsTable.recipeId, childRecipeIds));
    }

    const productIdsNested = childItemsRows
        .map((r) => r.productId)
        .filter(Boolean);

    const allProductIds = Array.from(new Set([...productIdsTop, ...productIdsNested]));

    // Availability (склад 1) по движениям
    let productAvailMap = new Map();
    if (allProductIds.length > 0) {
        const rows = await db
            .select({
                productId: StockMovementsTable.productId,
                availableBase: sql`
                    COALESCE(SUM(
                        CASE
                            WHEN ${StockMovementsTable.type} = 'Приход' THEN ${StockMovementsTable.quantityBase}
                            WHEN ${StockMovementsTable.type} = 'Списание' THEN -${StockMovementsTable.quantityBase}
                            WHEN ${StockMovementsTable.type} = 'Производство' THEN -${StockMovementsTable.quantityBase}
                            ELSE 0
                        END
                    ), 0)
                `.as("availableBase"),
            })
            .from(StockMovementsTable)
            .where(inArray(StockMovementsTable.productId, allProductIds))
            .groupBy(StockMovementsTable.productId);

        productAvailMap = new Map(rows.map((r) => [r.productId, r.availableBase]));
    }

    // Availability (склад 2) по партиям заготовок
    let recipeAvailMap = new Map();
    if (childRecipeIds.length > 0) {
        const rows = await db
            .select({
                recipeId: ProductionBatchesTable.recipeId,
                availableBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("availableBase"),
            })
            .from(ProductionBatchesTable)
            .where(inArray(ProductionBatchesTable.recipeId, childRecipeIds))
            .groupBy(ProductionBatchesTable.recipeId);

        recipeAvailMap = new Map(rows.map((r) => [r.recipeId, r.availableBase]));
    }

    // Группируем состав подрецептов по recipeId
    const childItemsMap = new Map();
    for (const r of childItemsRows) {
        if (!childItemsMap.has(r.recipeId)) childItemsMap.set(r.recipeId, []);
        childItemsMap.get(r.recipeId).push({
            amountBase: r.amountBase,
            availableBase: productAvailMap.get(r.productId) ?? "0",
            product: {
                id: r.productId,
                name: r.productName,
                type: r.productType,
            },
        });
    }

    const normalized = items.map((i) => {
        if (i.refType === "product") {
            return {
                id: i.id,
                refType: "product",
                amountBase: i.amountBase,
                availableBase: productAvailMap.get(i.productId) ?? "0",
                product: {
                    id: i.productId,
                    name: i.productName,
                    type: i.productType,
                },
                childRecipe: null,
                childItems: [],
            };
        }

        return {
            id: i.id,
            refType: "recipe",
            amountBase: i.amountBase,
            availableBase: recipeAvailMap.get(i.childRecipeId) ?? "0",
            product: null,
            childRecipe: {
                id: i.childRecipeId,
                name: i.childRecipeName,
                type: i.childRecipeType,
                defaultYieldBase: i.childDefaultYieldBase,
            },
            childItems: childItemsMap.get(i.childRecipeId) ?? [],
        };
    });

    return { recipe, items: normalized };
}