
// "use server";

// import { db } from "@/drizzle/db";
// import { eq, inArray, sql } from "drizzle-orm";
// import {
//     RecipesTable,
//     RecipeItemsTable,
//     ProductionBatchesTable,
//     ProductsTable,
//     StockMovementsTable,
// } from "@/drizzle/schema";

// export async function getRecipeTreeForDetailedView(recipeId) {
//     const [recipe] = await db
//         .select({
//             id: RecipesTable.id,
//             name: RecipesTable.name,
//             type: RecipesTable.type,
//             defaultYieldBase: RecipesTable.defaultYieldBase,
//         })
//         .from(RecipesTable)
//         .where(eq(RecipesTable.id, recipeId));

//     if (!recipe) throw new Error("Recipe not found");

//     const items = await db
//         .select({
//             id: RecipeItemsTable.id,
//             refType: RecipeItemsTable.refType,
//             amountBase: RecipeItemsTable.amountBase,

//             productId: RecipeItemsTable.productId,
//             childRecipeId: RecipeItemsTable.childRecipeId,

//             productName: ProductsTable.name,
//             productCategory: ProductsTable.category,

//             childRecipeName: sql`child_recipe.name`.as("childRecipeName"),
//             childRecipeType: sql`child_recipe.type`.as("childRecipeType"),
//             childDefaultYieldBase: sql`child_recipe.default_yield_base`.as("childDefaultYieldBase"),
//         })
//         .from(RecipeItemsTable)
//         .leftJoin(ProductsTable, eq(ProductsTable.id, RecipeItemsTable.productId))
//         .leftJoin(
//             sql`${RecipesTable} as child_recipe`,
//             sql`child_recipe.id = ${RecipeItemsTable.childRecipeId}`,
//         )
//         .where(eq(RecipeItemsTable.recipeId, recipeId));

//     const productIdsTop = items
//         .filter((i) => i.refType === "product" && i.productId)
//         .map((i) => i.productId);

//     const childRecipeIds = items
//         .filter((i) => i.refType === "recipe" && i.childRecipeId)
//         .map((i) => i.childRecipeId);

//     // состав подрецептов (только продукты)
//     let childItemsRows = [];
//     if (childRecipeIds.length > 0) {
//         childItemsRows = await db
//             .select({
//                 recipeId: RecipeItemsTable.recipeId,
//                 productId: RecipeItemsTable.productId,
//                 amountBase: RecipeItemsTable.amountBase,
//                 productName: ProductsTable.name,
//                 productCategory: ProductsTable.category,
//             })
//             .from(RecipeItemsTable)
//             .innerJoin(ProductsTable, eq(ProductsTable.id, RecipeItemsTable.productId))
//             .where(inArray(RecipeItemsTable.recipeId, childRecipeIds));
//     }

//     const productIdsNested = childItemsRows.map((r) => r.productId).filter(Boolean);
//     const allProductIds = Array.from(new Set([...productIdsTop, ...productIdsNested]));

//     // Availability (склад 1) по движениям — amountBase
//     let productAvailMap = new Map();
//     if (allProductIds.length > 0) {
//         const rows = await db
//             .select({
//                 productId: StockMovementsTable.productId,
//                 availableBase: sql`
//                     COALESCE(SUM(
//                         CASE
//                             WHEN ${StockMovementsTable.type} = 'Приход' THEN ${StockMovementsTable.amountBase}
//                             WHEN ${StockMovementsTable.type} = 'Списание' THEN -${StockMovementsTable.amountBase}
//                             WHEN ${StockMovementsTable.type} = 'Производство' THEN -${StockMovementsTable.amountBase}
//                             ELSE 0
//                         END
//                     ), 0)
//                 `.as("availableBase"),
//             })
//             .from(StockMovementsTable)
//             .where(inArray(StockMovementsTable.productId, allProductIds))
//             .groupBy(StockMovementsTable.productId);

//         productAvailMap = new Map(rows.map((r) => [r.productId, r.availableBase]));
//     }

//     // Availability (склад 2) по партиям заготовок
//     let recipeAvailMap = new Map();
//     if (childRecipeIds.length > 0) {
//         const rows = await db
//             .select({
//                 recipeId: ProductionBatchesTable.recipeId,
//                 availableBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("availableBase"),
//             })
//             .from(ProductionBatchesTable)
//             .where(inArray(ProductionBatchesTable.recipeId, childRecipeIds))
//             .groupBy(ProductionBatchesTable.recipeId);

//         recipeAvailMap = new Map(rows.map((r) => [r.recipeId, r.availableBase]));
//     }

//     // группировка child items
//     const childItemsMap = new Map();
//     for (const r of childItemsRows) {
//         if (!childItemsMap.has(r.recipeId)) childItemsMap.set(r.recipeId, []);
//         childItemsMap.get(r.recipeId).push({
//             amountBase: r.amountBase,
//             availableBase: productAvailMap.get(r.productId) ?? "0",
//             product: {
//                 id: r.productId,
//                 name: r.productName,
//                 category: r.productCategory,
//             },
//         });
//     }

//     const normalized = items.map((i) => {
//         if (i.refType === "product") {
//             return {
//                 id: i.id,
//                 refType: "product",
//                 amountBase: i.amountBase,
//                 availableBase: productAvailMap.get(i.productId) ?? "0",
//                 product: {
//                     id: i.productId,
//                     name: i.productName,
//                     category: i.productCategory,
//                 },
//                 childRecipe: null,
//                 childItems: [],
//             };
//         }

//         return {
//             id: i.id,
//             refType: "recipe",
//             amountBase: i.amountBase,
//             availableBase: recipeAvailMap.get(i.childRecipeId) ?? "0",
//             product: null,
//             childRecipe: {
//                 id: i.childRecipeId,
//                 name: i.childRecipeName,
//                 type: i.childRecipeType,
//                 defaultYieldBase: i.childDefaultYieldBase,
//             },
//             childItems: childItemsMap.get(i.childRecipeId) ?? [],
//         };
//     });

//     return { recipe, items: normalized };
// }


// actions/recipes/getRecipeTreeForDetailedView.js
"use server";
import { eq, sql, inArray, and } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
    RecipesTable,
    RecipeItemsTable,
    ProductsTable,
    ProductCategoriesTable,
    ProductBatchesTable,
    ProductionBatchesTable,
} from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { NotFoundError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanViewLocation } from "@/lib/auth/rbac";

/**
 * Возвращает рецепт + его items + items вложенных подрецептов (2 уровня).
 * Удобно для отображения в виде дерева в детальной карточке.
 */
export const getRecipeTreeForDetailedView = withAction(async ({ recipeId } = {}) => {
    // 1. Auth
    const user = await requireUser();

    // 4. Business logic
    // 4.1 Корневой рецепт
    const [recipe] = await db
        .select({
            id: RecipesTable.id,
            name: RecipesTable.name,
            type: RecipesTable.type,
            location: RecipesTable.location,
            category: RecipesTable.category,
            defaultYieldBase: RecipesTable.defaultYieldBase,
            note: RecipesTable.note,
            isArchived: RecipesTable.isArchived,
        })
        .from(RecipesTable)
        .where(eq(RecipesTable.id, recipeId));

    if (!recipe) throw new NotFoundError("Рецепт не найден");

    // 3. RBAC
    assertCanViewLocation(user, recipe.location);

    // 4.2 Items уровня 1
    const level1 = await loadItems(db, [recipe.id]);

    // 4.3 Items уровня 2 — для всех childRecipeId уровня 1
    const childIds = level1
        .filter((i) => i.refType === "recipe" && i.childRecipeId)
        .map((i) => i.childRecipeId);

    const level2 = childIds.length > 0 ? await loadItems(db, childIds) : [];

    // 4.4 Доступность продуктов / заготовок (по локации корневого рецепта)
    const allItems = [...level1, ...level2];
    const productIds = uniq(allItems.filter((i) => i.refType === "product").map((i) => i.productId));
    const subRecipeIds = uniq(allItems.filter((i) => i.refType === "recipe").map((i) => i.childRecipeId));

    const productAvail = await loadProductAvailability(productIds, recipe.location);
    const recipeAvail = await loadRecipeAvailability(subRecipeIds, recipe.location);

    // 4.5 Группировка level2 по родительскому subRecipeId
    const childItemsMap = new Map(); // subRecipeId → items[]
    for (const it of level2) {
        const arr = childItemsMap.get(it.recipeId) ?? [];
        arr.push(normalizeItem(it, productAvail, recipeAvail));
        childItemsMap.set(it.recipeId, arr);
    }

    // 4.6 Нормализация дерева
    const items = level1.map((it) => {
        const node = normalizeItem(it, productAvail, recipeAvail);
        if (it.refType === "recipe") {
            node.childRecipe.items = childItemsMap.get(it.childRecipeId) ?? [];
        }
        return node;
    });

    return { recipe, items };
});

// ─────────────────────────────────────────────────────────────────────────────

async function loadItems(executor, recipeIds) {
    return executor
        .select({
            id: RecipeItemsTable.id,
            recipeId: RecipeItemsTable.recipeId,
            refType: RecipeItemsTable.refType,
            amountBase: RecipeItemsTable.amountBase,
            productId: RecipeItemsTable.productId,
            childRecipeId: RecipeItemsTable.childRecipeId,

            productName: ProductsTable.name,
            productCategory: ProductCategoriesTable.name,

            childRecipeName: sql`child_recipe.name`.as("childRecipeName"),
            childRecipeType: sql`child_recipe.type`.as("childRecipeType"),
            childRecipeDefaultYield: sql`child_recipe.default_yield_base`.as("childRecipeDefaultYield"),
        })
        .from(RecipeItemsTable)
        .leftJoin(ProductsTable, eq(ProductsTable.id, RecipeItemsTable.productId))
        .leftJoin(
            ProductCategoriesTable,
            eq(ProductCategoriesTable.id, ProductsTable.categoryId),
        )
        .leftJoin(
            sql`${RecipesTable} as child_recipe`,
            sql`child_recipe.id = ${RecipeItemsTable.childRecipeId}`,
        )
        .where(inArray(RecipeItemsTable.recipeId, recipeIds));
}

async function loadProductAvailability(productIds, location) {
    const map = new Map();
    if (productIds.length === 0) return map;

    const rows = await db
        .select({
            productId: ProductBatchesTable.productId,
            availableBase:
                sql`COALESCE(SUM(${ProductBatchesTable.remainingBase}), 0)`.as("availableBase"),
        })
        .from(ProductBatchesTable)
        .where(
            and(
                inArray(ProductBatchesTable.productId, productIds),
                eq(ProductBatchesTable.location, location),
            ),
        )
        .groupBy(ProductBatchesTable.productId);

    for (const r of rows) map.set(r.productId, r.availableBase);
    return map;
}

async function loadRecipeAvailability(recipeIds, location) {
    const map = new Map();
    if (recipeIds.length === 0) return map;

    const rows = await db
        .select({
            recipeId: ProductionBatchesTable.recipeId,
            availableBase:
                sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("availableBase"),
        })
        .from(ProductionBatchesTable)
        .where(
            and(
                inArray(ProductionBatchesTable.recipeId, recipeIds),
                eq(ProductionBatchesTable.location, location),
            ),
        )
        .groupBy(ProductionBatchesTable.recipeId);

    for (const r of rows) map.set(r.recipeId, r.availableBase);
    return map;
}

function normalizeItem(i, productAvail, recipeAvail) {
    return {
        id: i.id,
        refType: i.refType,
        amountBase: i.amountBase,
        availableBase:
            i.refType === "product"
                ? productAvail.get(i.productId) ?? "0"
                : recipeAvail.get(i.childRecipeId) ?? "0",
        product:
            i.refType === "product"
                ? { id: i.productId, name: i.productName, category: i.productCategory }
                : null,
        childRecipe:
            i.refType === "recipe"
                ? {
                      id: i.childRecipeId,
                      name: i.childRecipeName,
                      type: i.childRecipeType,
                      defaultYieldBase: i.childRecipeDefaultYield,
                      items: [], // заполнится снаружи
                  }
                : null,
    };
}

function uniq(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
}