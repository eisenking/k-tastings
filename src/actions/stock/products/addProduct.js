"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/drizzle/db";
import {
    ProductsTable,
    ProductBatchesTable,
    StockMovementsTable,
} from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { ConflictError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";
import { recalculateBalance } from "@/lib/stock/updateBalance";
import { toBase, assertUnitCompatible } from "@/lib/helpers/units";

import {
    addProductSchema,
    isProductNameTaken,
    getCategoryOrThrow,
    getProductOrThrow,
} from "./_shared";

export const addProduct = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(addProductSchema, input);
    const isExisting = !!data.productId;

    // 3. RBAC
    assertCanModifyLocation(user, data.location);

    // 4. Business logic + audit в одной транзакции
    const result = await db.transaction(async (tx) => {
        // 4.1 Получаем/создаём продукт
        let product;
        let categoryName = null;

        if (isExisting) {
            // 4.1a Приход в существующий: проверяем продукт и локацию
            product = await getProductOrThrow(tx, {
                id: data.productId,
                location: data.location,
            });
        } else {
            // 4.1b Новый продукт: уникальность имени + валидация категории
            if (await isProductNameTaken(tx, { name: data.name, location: data.location })) {
                throw new ConflictError("Продукт с таким названием уже есть в этой локации");
            }
            const category = await getCategoryOrThrow(tx, {
                id: data.categoryId,
                location: data.location,
            });
            categoryName = category.name;

            [product] = await tx
                .insert(ProductsTable)
                .values({
                    name: data.name,
                    categoryId: data.categoryId,
                    location: data.location,
                    measure: data.measure,
                    baseUnit: data.baseUnit,
                    pieceToBase:
                        data.pieceToBase != null ? String(data.pieceToBase) : null,
                    userId: user.id,
                })
                .returning();

            // Audit создания продукта
            await logActivity({
                tx,
                user,
                action: "create",
                entity: "product",
                entityId: product.id,
                location: data.location,
                description: `Создан продукт «${product.name}» в категории «${categoryName}»`,
                metadata: {
                    name: product.name,
                    categoryId: product.categoryId,
                    categoryName,
                    measure: product.measure,
                    baseUnit: product.baseUnit,
                    pieceToBase: product.pieceToBase,
                },
            });
        }

        // 4.2 Подготовка партии — проверка единицы и конверсия
        const { qty, unit, totalCost, expirationDate } = data.batch;

        assertUnitCompatible({
            inputUnit: unit,
            productMeasure: product.measure,
            productBaseUnit: product.baseUnit,
        });

        // Для штучных продуктов pieceToBase берём из продукта (он уже в БД как numeric=string)
        const pieceToBaseNum =
            product.pieceToBase != null ? Number(product.pieceToBase) : null;

        const qtyBase = toBase({ unit, qty, pieceToBase: pieceToBaseNum });
        const unitCostBase = totalCost / qtyBase;

        // 4.3 Создание партии
        const [batch] = await tx
            .insert(ProductBatchesTable)
            .values({
                productId: product.id,
                location: data.location,
                expirationDate: expirationDate ?? null,
                receivedBase: String(qtyBase),
                remainingBase: String(qtyBase),
                totalCost: String(totalCost),
                unitCostBase: String(unitCostBase),
                userId: user.id,
            })
            .returning();

        // 4.4 Движение склада (приход)
        await tx.insert(StockMovementsTable).values({
            productId: product.id,
            batchId: batch.id,
            location: data.location,
            type: "receipt",
            amountBase: String(qtyBase),
            cost: String(totalCost),
            userId: user.id,
            userName: user.name ?? "—",
        });

        // 4.5 Пересчёт баланса
        await recalculateBalance(tx, {
            productId: product.id,
            location: data.location,
        });

        // 4.6 Audit прихода
        await logActivity({
            tx,
            user,
            action: "stock_receipt",
            entity: "product_batch",
            entityId: batch.id,
            location: data.location,
            description: `Приход «${product.name}»: ${qty} ${unit} за ${totalCost} ₽`,
            metadata: {
                productId: product.id,
                productName: product.name,
                qtyBase,
                inputQty: qty,
                inputUnit: unit,
                totalCost,
                unitCostBase,
                expirationDate: expirationDate ?? null,
                isNewProduct: !isExisting,
            },
        });

        return { product, batch, isNewProduct: !isExisting };
    });

    // 5. Revalidate
    revalidatePath(`/${data.location}`);
    revalidatePath("/admin");

    return result;
});