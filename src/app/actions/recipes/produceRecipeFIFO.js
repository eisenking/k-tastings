"use server";

import { db } from "@/drizzle/db";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import {
    RecipesTable,
    RecipeItemsTable,
    ProductionBatchesTable,
    ProductionConsumptionsTable,
    ProductsTable,
    ProductBatchesTable,
    ProductVariantsTable,
    StockMovementsTable,
} from "@/drizzle/schema";

import { ensureBaseVariant } from "./_helpers/ensureBaseVariant";

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

function round6(n) {
    return Math.round(n * 1e6) / 1e6;
}

export async function produceRecipeFIFO({ recipeId, amountBase, expirationDate = null }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const userName = session.user.name || session.user.email || "user";

    const targetAmount = toNum(amountBase, 0);
    if (!recipeId || targetAmount <= 0) {
        throw new Error("recipeId/amountBase required");
    }

    return await db.transaction(async (tx) => {
        const visited = new Set();

        async function getRecipe(recipeIdInner) {
            const [r] = await tx
                .select({
                    id: RecipesTable.id,
                    name: RecipesTable.name,
                    type: RecipesTable.type,
                    defaultYieldBase: RecipesTable.defaultYieldBase,
                })
                .from(RecipesTable)
                .where(eq(RecipesTable.id, recipeIdInner));

            if (!r) throw new Error("Recipe not found");
            const base = toNum(r.defaultYieldBase, 0);
            if (base <= 0) throw new Error(`Recipe defaultYieldBase invalid: ${r.name}`);
            return { ...r, defaultYieldBaseNum: base };
        }

        async function getItems(recipeIdInner) {
            const rows = await tx
                .select({
                    id: RecipeItemsTable.id,
                    refType: RecipeItemsTable.refType,
                    productId: RecipeItemsTable.productId,
                    childRecipeId: RecipeItemsTable.childRecipeId,
                    amountBase: RecipeItemsTable.amountBase,
                })
                .from(RecipeItemsTable)
                .where(eq(RecipeItemsTable.recipeId, recipeIdInner));

            return rows.map((x) => ({
                ...x,
                amountBaseNum: toNum(x.amountBase, 0),
            }));
        }

        async function getAvailablePrepBase(prepRecipeId) {
            const [row] = await tx
                .select({
                    availableBase: sql`COALESCE(SUM(${ProductionBatchesTable.remainingBase}), 0)`.as("availableBase"),
                })
                .from(ProductionBatchesTable)
                .where(eq(ProductionBatchesTable.recipeId, prepRecipeId));

            return toNum(row?.availableBase, 0);
        }

        async function getProductBatchesWithRemaining(productId) {
            // Берём партии товара, и считаем remainingBase по движениям этой партии
            // remainingBase = SUM(Приход) - SUM(Списание) - SUM(Производство)
            const batches = await tx
                .select({
                    id: ProductBatchesTable.id,
                    receivedAt: ProductBatchesTable.receivedAt,
                    variantId: ProductBatchesTable.variantId,
                    purchasePrice: ProductBatchesTable.purchasePrice,
                })
                .from(ProductBatchesTable)
                .where(eq(ProductBatchesTable.productId, productId))
                .orderBy(asc(ProductBatchesTable.receivedAt));

            if (batches.length === 0) return [];

            const batchIds = batches.map((b) => b.id);

            const moves = await tx
                .select({
                    batchId: StockMovementsTable.batchId,
                    deltaBase: sql`
                        COALESCE(SUM(
                            CASE
                                WHEN ${StockMovementsTable.type} = 'Приход' THEN ${StockMovementsTable.quantityBase}
                                WHEN ${StockMovementsTable.type} = 'Списание' THEN -${StockMovementsTable.quantityBase}
                                WHEN ${StockMovementsTable.type} = 'Производство' THEN -${StockMovementsTable.quantityBase}
                                ELSE 0
                            END
                        ), 0)
                    `.as("deltaBase"),
                })
                .from(StockMovementsTable)
                .where(inArray(StockMovementsTable.batchId, batchIds))
                .groupBy(StockMovementsTable.batchId);

            const map = new Map(moves.map((m) => [m.batchId, toNum(m.deltaBase, 0)]));

            // unitCostBase = purchasePrice / conversionToBase
            const variantIds = Array.from(new Set(batches.map((b) => b.variantId)));

            const variants = await tx
                .select({
                    id: ProductVariantsTable.id,
                    conversionToBase: ProductVariantsTable.conversionToBase,
                })
                .from(ProductVariantsTable)
                .where(inArray(ProductVariantsTable.id, variantIds));

            const convMap = new Map(variants.map((v) => [v.id, toNum(v.conversionToBase, 1)]));

            return batches.map((b) => {
                const remainingBase = map.get(b.id) ?? 0;
                const conv = convMap.get(b.variantId) ?? 1;
                const purchasePrice = b.purchasePrice === null ? null : toNum(b.purchasePrice, 0);
                const unitCostBase = purchasePrice === null ? null : (conv > 0 ? purchasePrice / conv : null);

                return {
                    ...b,
                    remainingBase,
                    conversionToBase: conv,
                    unitCostBase,
                };
            });
        }

        async function consumeProductFIFO({ productId, requiredBase, reason, targetBatchId }) {
            // Ensure base variant exists (вариант 1), пусть будет создан заранее
            await ensureBaseVariant(tx, productId, userId, userName);

            const batches = await getProductBatchesWithRemaining(productId);

            let need = requiredBase;
            let totalCost = 0;

            for (const b of batches) {
                if (need <= 0) break;

                const avail = b.remainingBase;
                if (avail <= 0) continue;

                const takeBase = Math.min(avail, need);

                // quantity в единицах варианта партии
                const qty = b.conversionToBase > 0 ? takeBase / b.conversionToBase : takeBase;

                // Стоимость: если purchasePrice отсутствует, считаем 0 (можно поменять на ошибку)
                const cost = b.unitCostBase === null ? 0 : takeBase * b.unitCostBase;

                // Движение склада 1
                await tx.insert(StockMovementsTable).values({
                    productId,
                    batchId: b.id,
                    variantId: b.variantId,
                    type: "Производство",
                    quantity: String(round6(qty)),
                    quantityBase: String(round6(takeBase)),
                    reason,
                    userId,
                    userName,
                });

                // Аудит списания для партии производства
                await tx.insert(ProductionConsumptionsTable).values({
                    targetBatchId,
                    sourceType: "product_batch",
                    productBatchId: b.id,
                    sourceBatchId: null,

                    productId,
                    sourceRecipeId: null,

                    amountBase: String(round6(takeBase)),
                    cost: String(round6(cost)),

                    userId,
                    userName,
                });

                need -= takeBase;
                totalCost += cost;
            }

            if (need > 0.000001) {
                // Для сообщения — имя продукта
                const [p] = await tx
                    .select({ name: ProductsTable.name })
                    .from(ProductsTable)
                    .where(eq(ProductsTable.id, productId));

                throw new Error(`Недостаточно "${p?.name || "продукта"}": не хватает ${Math.ceil(need)} г`);
            }

            return totalCost;
        }

        async function consumePreparationFIFO({ prepRecipeId, requiredBase, reason, targetBatchId }) {
            // Пытаемся списать из партий заготовки FIFO
            let need = requiredBase;
            let totalCost = 0;

            const batches = await tx
                .select({
                    id: ProductionBatchesTable.id,
                    recipeId: ProductionBatchesTable.recipeId,
                    remainingBase: ProductionBatchesTable.remainingBase,
                    unitCostBase: ProductionBatchesTable.unitCostBase,
                    producedAt: ProductionBatchesTable.producedAt,
                })
                .from(ProductionBatchesTable)
                .where(eq(ProductionBatchesTable.recipeId, prepRecipeId))
                .orderBy(asc(ProductionBatchesTable.producedAt));

            for (const b of batches) {
                if (need <= 0) break;

                const avail = toNum(b.remainingBase, 0);
                if (avail <= 0) continue;

                const takeBase = Math.min(avail, need);
                const unitCost = toNum(b.unitCostBase, 0);
                const cost = takeBase * unitCost;

                // уменьшить remainingBase
                await tx
                    .update(ProductionBatchesTable)
                    .set({
                        remainingBase: String(round6(avail - takeBase)),
                    })
                    .where(eq(ProductionBatchesTable.id, b.id));

                await tx.insert(ProductionConsumptionsTable).values({
                    targetBatchId,
                    sourceType: "production_batch",
                    productBatchId: null,
                    sourceBatchId: b.id,

                    productId: null,
                    sourceRecipeId: prepRecipeId,

                    amountBase: String(round6(takeBase)),
                    cost: String(round6(cost)),

                    userId,
                    userName,
                });

                need -= takeBase;
                totalCost += cost;
            }

            if (need > 0.000001) {
                // Автопроизводство недостающей заготовки (если возможно)
                const availableNow = await getAvailablePrepBase(prepRecipeId);
                const shortage = Math.max(0, requiredBase - availableNow);

                if (shortage <= 0.000001) {
                    // редкий кейс гонки, пробуем ещё раз
                    return await consumePreparationFIFO({ prepRecipeId, requiredBase, reason, targetBatchId });
                }

                // произвести недостающее (рекурсивно)
                await produceInternal(prepRecipeId, shortage, null);

                // и списать снова
                return await consumePreparationFIFO({ prepRecipeId, requiredBase, reason, targetBatchId });
            }

            return totalCost;
        }

        async function produceInternal(recipeIdInner, amountBaseInner, expirationDateInner) {
            if (visited.has(recipeIdInner)) {
                throw new Error("Циклическая ссылка в рецептах (обнаружен цикл)");
            }
            visited.add(recipeIdInner);

            const recipe = await getRecipe(recipeIdInner);
            const items = await getItems(recipeIdInner);

            if (items.length === 0) {
                throw new Error(`У рецепта "${recipe.name}" нет состава`);
            }

            const factor = amountBaseInner / recipe.defaultYieldBaseNum;

            // заранее создаём target batch, чтобы в production_consumptions был targetBatchId
            const [targetBatch] = await tx
                .insert(ProductionBatchesTable)
                .values({
                    recipeId: recipe.id,
                    producedBase: String(round6(amountBaseInner)),
                    remainingBase: String(round6(amountBaseInner)), // временно, потом подтвердим
                    totalCost: "0",
                    unitCostBase: "0",
                    producedAt: new Date(),
                    expirationDate: expirationDateInner,
                    note: `Производство: ${recipe.name}`,
                    userId,
                    userName,
                })
                .returning();

            let totalCost = 0;
            const reason = `Изготовление: ${recipe.name}`;

            for (const it of items) {
                const requiredBase = round6(it.amountBaseNum * factor);
                if (requiredBase <= 0) continue;

                if (it.refType === "product") {
                    totalCost += await consumeProductFIFO({
                        productId: it.productId,
                        requiredBase,
                        reason,
                        targetBatchId: targetBatch.id,
                    });
                } else {
                    // подрецепт (заготовка)
                    totalCost += await consumePreparationFIFO({
                        prepRecipeId: it.childRecipeId,
                        requiredBase,
                        reason,
                        targetBatchId: targetBatch.id,
                    });
                }
            }

            const unitCostBase = amountBaseInner > 0 ? totalCost / amountBaseInner : 0;

            await tx
                .update(ProductionBatchesTable)
                .set({
                    totalCost: String(round6(totalCost)),
                    unitCostBase: String(round6(unitCostBase)),
                    // remainingBase уже стоит amount, оставляем
                })
                .where(eq(ProductionBatchesTable.id, targetBatch.id));

            visited.delete(recipeIdInner);

            return targetBatch;
        }

        // Внешний запуск
        const batch = await produceInternal(recipeId, targetAmount, expirationDate);

        return batch;
    });
}