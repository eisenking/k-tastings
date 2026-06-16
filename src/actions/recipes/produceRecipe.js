// actions/recipes/produceRecipe.js
"use server";
import { revalidatePath } from "next/cache";
import { asc, eq, and, gt } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
    RecipesTable,
    RecipeItemsTable,
    ProductsTable,
    ProductBatchesTable,
    ProductionBatchesTable,
    ProductionConsumptionsTable,
    StockMovementsTable,
} from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { ConflictError, ValidationError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";
import { recalculateBalance } from "@/lib/stock/updateBalance";

import {
    produceRecipeSchema,
    getRecipeOrThrow,
    round6,
    toNum,
} from "./_shared";

export const produceRecipe = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(produceRecipeSchema, input);

    // 4. Business logic + audit
    const result = await db.transaction(async (tx) => {
        // 4.1 Получаем рецепт + RBAC + базовые проверки
        const recipe = await getRecipeOrThrow(tx, { id: data.recipeId });
        assertCanModifyLocation(user, recipe.location);

        if (recipe.isArchived) {
            throw new ValidationError("Нельзя производить архивный рецепт");
        }

        // 4.2 Производство (с рекурсивным авто-производством заготовок)
        const ctx = {
            tx,
            user,
            location: recipe.location,
            visited: new Set(),
            // Затронутые продукты для финального пересчёта баланса
            touchedProductIds: new Set(),
        };

        const targetBatch = await produceInternal(ctx, {
            recipeId: recipe.id,
            amountBase: data.amountBase,
            expirationDate: data.expirationDate ?? null,
            note: data.note ?? null,
            isRoot: true,
        });

        // 4.3 Пересчёт балансов всех затронутых продуктов
        for (const productId of ctx.touchedProductIds) {
            await recalculateBalance(tx, {
                productId,
                location: recipe.location,
            });
        }

        // 4.4 Audit (по корневому рецепту; вложенные производства логируются внутри produceInternal)
        await logActivity({
            tx,
            user,
            action: "production_create",
            entity: "production_batch",
            entityId: targetBatch.id,
            location: recipe.location,
            description: `Произведено «${recipe.name}»: ${data.amountBase} (base)`,
            metadata: {
                recipeId: recipe.id,
                recipeName: recipe.name,
                recipeType: recipe.type,
                amountBase: data.amountBase,
                totalCost: targetBatch.totalCost,
                unitCostBase: targetBatch.unitCostBase,
                expirationDate: data.expirationDate ?? null,
            },
        });

        return targetBatch;
    });

    // 5. Revalidate
    revalidatePath(`/${result.location}`);
    revalidatePath("/admin");

    return result;
});

// ─────────────────────────────────────────────────────────────────────────────
// Рекурсивное производство
// ─────────────────────────────────────────────────────────────────────────────

async function produceInternal(ctx, { recipeId, amountBase, expirationDate, note, isRoot }) {
    const { tx, user, location, visited } = ctx;

    // Защита от циклов в рецептах
    if (visited.has(recipeId)) {
        throw new ConflictError("Циклическая ссылка в рецептах");
    }
    visited.add(recipeId);

    // Загружаем рецепт + items
    const [recipe] = await tx
        .select({
            id: RecipesTable.id,
            name: RecipesTable.name,
            type: RecipesTable.type,
            location: RecipesTable.location,
            defaultYieldBase: RecipesTable.defaultYieldBase,
            isArchived: RecipesTable.isArchived,
        })
        .from(RecipesTable)
        .where(eq(RecipesTable.id, recipeId));

    if (!recipe) throw new ValidationError("Подрецепт не найден");
    if (recipe.location !== location) {
        throw new ValidationError("Подрецепт находится в другой локации");
    }
    if (recipe.isArchived) {
        throw new ValidationError(`Подрецепт «${recipe.name}» архивирован`);
    }

    const defaultYield = toNum(recipe.defaultYieldBase, 0);
    if (defaultYield <= 0) {
        throw new ValidationError(`Некорректный выход рецепта «${recipe.name}»`);
    }

    const items = await tx
        .select({
            refType: RecipeItemsTable.refType,
            productId: RecipeItemsTable.productId,
            childRecipeId: RecipeItemsTable.childRecipeId,
            amountBase: RecipeItemsTable.amountBase,
        })
        .from(RecipeItemsTable)
        .where(eq(RecipeItemsTable.recipeId, recipe.id));

    if (items.length === 0) {
        throw new ValidationError(`У рецепта «${recipe.name}» нет состава`);
    }

    // Создаём целевую партию (cost обновим в конце)
    const [targetBatch] = await tx
        .insert(ProductionBatchesTable)
        .values({
            recipeId: recipe.id,
            location: recipe.location,
            producedBase: String(round6(amountBase)),
            remainingBase: String(round6(amountBase)),
            totalCost: "0",
            unitCostBase: "0",
            expirationDate: expirationDate ?? null,
            note: note ?? (isRoot ? null : `Авто-производство для родительского рецепта`),
            userId: user.id,
        })
        .returning();

    // Множитель относительно дефолтного выхода
    const factor = amountBase / defaultYield;
    let totalCost = 0;

    for (const item of items) {
        const required = round6(toNum(item.amountBase, 0) * factor);
        if (required <= 0) continue;

        if (item.refType === "product") {
            totalCost += await consumeProductFIFO(ctx, {
                productId: item.productId,
                requiredBase: required,
                targetBatchId: targetBatch.id,
                recipeName: recipe.name,
            });
        } else {
            totalCost += await consumePreparationFIFO(ctx, {
                prepRecipeId: item.childRecipeId,
                requiredBase: required,
                targetBatchId: targetBatch.id,
                recipeName: recipe.name,
            });
        }
    }

    const unitCostBase = amountBase > 0 ? totalCost / amountBase : 0;

    const [updated] = await tx
        .update(ProductionBatchesTable)
        .set({
            totalCost: String(round6(totalCost)),
            unitCostBase: String(round6(unitCostBase)),
        })
        .where(eq(ProductionBatchesTable.id, targetBatch.id))
        .returning();

    // Audit для вложенных авто-производств (root логируется в основном экшене)
    if (!isRoot) {
        await logActivity({
            tx,
            user,
            action: "production_create",
            entity: "production_batch",
            entityId: updated.id,
            location: recipe.location,
            description: `Авто-производство «${recipe.name}»: ${round6(amountBase)} (base)`,
            metadata: {
                recipeId: recipe.id,
                recipeName: recipe.name,
                amountBase,
                totalCost: updated.totalCost,
                unitCostBase: updated.unitCostBase,
                auto: true,
            },
        });
    }

    visited.delete(recipeId);
    return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIFO потребление продукта со склада
// ─────────────────────────────────────────────────────────────────────────────

async function consumeProductFIFO(ctx, { productId, requiredBase, targetBatchId, recipeName }) {
    const { tx, user, location } = ctx;

    // Подтягиваем партии с остатком в нужной локации, FIFO по дате прихода
    const batches = await tx
        .select({
            id: ProductBatchesTable.id,
            remainingBase: ProductBatchesTable.remainingBase,
            unitCostBase: ProductBatchesTable.unitCostBase,
        })
        .from(ProductBatchesTable)
        .where(
            and(
                eq(ProductBatchesTable.productId, productId),
                eq(ProductBatchesTable.location, location),
                gt(ProductBatchesTable.remainingBase, "0"),
            ),
        )
        .orderBy(asc(ProductBatchesTable.receivedAt));

    let need = requiredBase;
    let totalCost = 0;

    for (const b of batches) {
        if (need <= 0) break;

        const avail = toNum(b.remainingBase, 0);
        if (avail <= 0) continue;

        const take = Math.min(avail, need);
        const unitCost = toNum(b.unitCostBase, 0);
        const cost = take * unitCost;

        // Уменьшаем остаток партии
        await tx
            .update(ProductBatchesTable)
            .set({ remainingBase: String(round6(avail - take)) })
            .where(eq(ProductBatchesTable.id, b.id));

        // Движение склада (производство)
        await tx.insert(StockMovementsTable).values({
            productId,
            batchId: b.id,
            location,
            type: "production",
            amountBase: String(round6(take)),
            cost: String(round6(cost)),
            userId: user.id,
            userName: user.name ?? "—",
        });

        // Лог потребления для целевой партии производства
        await tx.insert(ProductionConsumptionsTable).values({
            targetBatchId,
            sourceType: "product_batch",
            productBatchId: b.id,
            productId,
            amountBase: String(round6(take)),
            cost: String(round6(cost)),
            userId: user.id,
        });

        need -= take;
        totalCost += cost;
    }

    if (need > 1e-6) {
        const [p] = await tx
            .select({ name: ProductsTable.name })
            .from(ProductsTable)
            .where(eq(ProductsTable.id, productId));
        throw new ConflictError(
            `Недостаточно «${p?.name ?? "продукта"}» для рецепта «${recipeName}»: не хватает ${round6(need)}`,
        );
    }

    ctx.touchedProductIds.add(productId);
    return totalCost;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIFO потребление заготовки (с авто-производством при нехватке)
// ─────────────────────────────────────────────────────────────────────────────

async function consumePreparationFIFO(ctx, { prepRecipeId, requiredBase, targetBatchId, recipeName }) {
    const { tx, user, location } = ctx;

    // Один проход FIFO — пока хватает остатков
    let need = requiredBase;
    let totalCost = 0;

    while (need > 1e-6) {
        const batches = await tx
            .select({
                id: ProductionBatchesTable.id,
                remainingBase: ProductionBatchesTable.remainingBase,
                unitCostBase: ProductionBatchesTable.unitCostBase,
            })
            .from(ProductionBatchesTable)
            .where(
                and(
                    eq(ProductionBatchesTable.recipeId, prepRecipeId),
                    eq(ProductionBatchesTable.location, location),
                    gt(ProductionBatchesTable.remainingBase, "0"),
                ),
            )
            .orderBy(asc(ProductionBatchesTable.producedAt));

        // Сколько всего доступно сейчас
        const availableNow = batches.reduce((acc, b) => acc + toNum(b.remainingBase, 0), 0);

        if (availableNow <= 0) {
            // Авто-производство недостающего объёма
            await produceInternal(ctx, {
                recipeId: prepRecipeId,
                amountBase: need,
                expirationDate: null,
                note: null,
                isRoot: false,
            });
            continue; // перечитываем партии после производства
        }

        for (const b of batches) {
            if (need <= 1e-6) break;

            const avail = toNum(b.remainingBase, 0);
            if (avail <= 0) continue;

            const take = Math.min(avail, need);
            const unitCost = toNum(b.unitCostBase, 0);
            const cost = take * unitCost;

            await tx
                .update(ProductionBatchesTable)
                .set({ remainingBase: String(round6(avail - take)) })
                .where(eq(ProductionBatchesTable.id, b.id));

            await tx.insert(ProductionConsumptionsTable).values({
                targetBatchId,
                sourceType: "production_batch",
                sourceBatchId: b.id,
                sourceRecipeId: prepRecipeId,
                amountBase: String(round6(take)),
                cost: String(round6(cost)),
                userId: user.id,
            });

            need -= take;
            totalCost += cost;
        }

        // Если после прохода всё ещё не хватает — допроизводим недостающее
        if (need > 1e-6) {
            await produceInternal(ctx, {
                recipeId: prepRecipeId,
                amountBase: need,
                expirationDate: null,
                note: null,
                isRoot: false,
            });
        }
    }

    return totalCost;
}