// "use server";
// import { revalidatePath } from "next/cache";
// import { eq } from "drizzle-orm";
// import { db } from "@/drizzle/db";
// import {
//     ProductsTable,
//     ProductBatchesTable,
//     StockMovementsTable,
//     StockTransfersTable,
// } from "@/drizzle/schema";

// import { withAction } from "@/lib/utils/action-response";
// import { parseInput } from "@/lib/utils/validation";
// import { ValidationError } from "@/lib/utils/errors";
// import { requireUser } from "@/lib/auth/session";
// import { assertCanTransfer } from "@/lib/auth/rbac";
// import { logActivity } from "@/lib/audit/log";
// import { recalculateBalance } from "@/lib/stock/updateBalance";

// import {
//     transferProductSchema,
//     getProductOrThrow,
//     getCategoryOrThrow,
//     consumeFifoBatches,
//     findProductByName,
// } from "./_shared";

// export const transferProduct = withAction(async (input) => {
//     // 1. Auth
//     const user = await requireUser();

//     // 2. Validation
//     const data = parseInput(transferProductSchema, input);

//     // 3. RBAC — transfer'ы делают только admin/office
//     assertCanTransfer(user);

//     // 4. Business logic + audit в одной транзакции
//     const result = await db.transaction(async (tx) => {
//         // 4.1 Source: продукт должен существовать в fromLocation
//         const sourceProduct = await getProductOrThrow(tx, {
//             id: data.productId,
//             location: data.fromLocation,
//         });

//         // 4.2 Destination: ищем продукт-аналог по имени, иначе создаём.
//         //     measure/baseUnit/pieceToBase копируются с источника — иначе FIFO/баланс «поедут».
//         let destinationProduct = await findProductByName(tx, {
//             name: sourceProduct.name,
//             location: data.toLocation,
//         });

//         if (!destinationProduct) {
//             if (!data.targetCategoryId) {
//                 throw new ValidationError(
//                     `Продукт «${sourceProduct.name}» отсутствует в получателе — укажите категорию для создания`,
//                     { targetCategoryId: "Категория обязательна" },
//                 );
//             }
//             await getCategoryOrThrow(tx, {
//                 id: data.targetCategoryId,
//                 location: data.toLocation,
//             });

//             [destinationProduct] = await tx
//                 .insert(ProductsTable)
//                 .values({
//                     name: sourceProduct.name,
//                     categoryId: data.targetCategoryId,
//                     location: data.toLocation,
//                     measure: sourceProduct.measure,
//                     baseUnit: sourceProduct.baseUnit,
//                     pieceToBase: sourceProduct.pieceToBase,
//                     userId: user.id,
//                 })
//                 .returning();

//             await logActivity({
//                 tx,
//                 user,
//                 action: "create",
//                 entity: "product",
//                 entityId: destinationProduct.id,
//                 location: data.toLocation,
//                 description: `Создан продукт «${destinationProduct.name}» (через перемещение)`,
//                 metadata: {
//                     viaTransfer: true,
//                     sourceProductId: sourceProduct.id,
//                     fromLocation: data.fromLocation,
//                 },
//             });
//         }

//         // 4.3 FIFO-списание из источника (lock + decrement remainingBase)
//         const { consumed, totalCost, singleSourceBatchId } = await consumeFifoBatches(tx, {
//             productId: sourceProduct.id,
//             location: data.fromLocation,
//             amountBase: data.quantityBase,
//         });

//         // 4.4 Transfer header. destinationBatchId выставим после создания destination-партии.
//         const unitCostBase = totalCost / data.quantityBase;
//         const [transfer] = await tx
//             .insert(StockTransfersTable)
//             .values({
//                 productId: sourceProduct.id, // header привязан к source-продукту
//                 fromLocation: data.fromLocation,
//                 toLocation: data.toLocation,
//                 amountBase: String(data.quantityBase),
//                 totalCost: String(totalCost),
//                 sourceBatchId: singleSourceBatchId, // null если списано из нескольких партий
//                 status: "completed",
//                 note: data.reason ?? null,
//                 userId: user.id,
//                 userName: user.name ?? "—",
//                 completedAt: new Date(),
//             })
//             .returning();

//         // 4.5 Destination-партия (одна, со взвешенной себестоимостью)
//         const [destBatch] = await tx
//             .insert(ProductBatchesTable)
//             .values({
//                 productId: destinationProduct.id,
//                 location: data.toLocation,
//                 receivedBase: String(data.quantityBase),
//                 remainingBase: String(data.quantityBase),
//                 totalCost: String(totalCost),
//                 unitCostBase: String(unitCostBase),
//                 sourceBatchId: singleSourceBatchId,
//                 userId: user.id,
//             })
//             .returning();

//         await tx
//             .update(StockTransfersTable)
//             .set({ destinationBatchId: destBatch.id })
//             .where(eq(StockTransfersTable.id, transfer.id));

//         // 4.6 Movements:
//         //     transfer_out — по одному на каждую затронутую source-партию (трассируемость FIFO)
//         //     transfer_in  — один, на destination-партию
//         await tx.insert(StockMovementsTable).values([
//             ...consumed.map((c) => ({
//                 productId: sourceProduct.id,
//                 batchId: c.batchId,
//                 location: data.fromLocation,
//                 type: "transfer_out",
//                 reason: data.reason ?? null,
//                 amountBase: String(c.amount),
//                 cost: String(c.cost),
//                 transferId: transfer.id,
//                 userId: user.id,
//                 userName: user.name ?? "—",
//             })),
//             {
//                 productId: destinationProduct.id,
//                 batchId: destBatch.id,
//                 location: data.toLocation,
//                 type: "transfer_in",
//                 reason: data.reason ?? null,
//                 amountBase: String(data.quantityBase),
//                 cost: String(totalCost),
//                 transferId: transfer.id,
//                 userId: user.id,
//                 userName: user.name ?? "—",
//             },
//         ]);

//         // 4.7 Пересчёт балансов обеих локаций
//         await recalculateBalance(tx, {
//             productId: sourceProduct.id,
//             location: data.fromLocation,
//         });
//         await recalculateBalance(tx, {
//             productId: destinationProduct.id,
//             location: data.toLocation,
//         });

//         // 4.8 Audit — одна запись на всю операцию
//         await logActivity({
//             tx,
//             user,
//             action: "stock_transfer",
//             entity: "stock_transfer",
//             entityId: transfer.id,
//             location: data.fromLocation, // основная локация события — отправитель
//             description:
//                 `Перемещение «${sourceProduct.name}»: ` +
//                 `${data.quantityBase} ${sourceProduct.baseUnit} ` +
//                 `${data.fromLocation} → ${data.toLocation}`,
//             metadata: {
//                 transferId: transfer.id,
//                 sourceProductId: sourceProduct.id,
//                 destinationProductId: destinationProduct.id,
//                 fromLocation: data.fromLocation,
//                 toLocation: data.toLocation,
//                 amountBase: data.quantityBase,
//                 totalCost,
//                 unitCostBase,
//                 batchesAffected: consumed.length,
//                 sourceBatches: consumed.map((c) => ({
//                     batchId: c.batchId,
//                     amount: c.amount,
//                     cost: c.cost,
//                 })),
//                 destinationBatchId: destBatch.id,
//                 note: data.reason ?? null,
//             },
//         });

//         return {
//             transferId: transfer.id,
//             destinationProductId: destinationProduct.id,
//             destinationBatchId: destBatch.id,
//             totalCost,
//             batchesAffected: consumed.length,
//         };
//     });

//     // 5. Revalidate — обе локации + страница продукта + админка
//     revalidatePath(`/${data.fromLocation}`);
//     revalidatePath(`/${data.toLocation}`);
//     revalidatePath(`/product/${data.productId}`);
//     revalidatePath(`/product/${result.destinationProductId}`);
//     revalidatePath("/admin");

//     return result;
// });


"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
    ProductsTable,
    ProductCategoriesTable,
    ProductBatchesTable,
    StockMovementsTable,
    StockTransfersTable,
} from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { ValidationError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanTransfer } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";
import { recalculateBalance } from "@/lib/stock/updateBalance";

import {
    transferProductSchema,
    getProductOrThrow,
    getCategoryOrThrow,
    consumeFifoBatches,
    findProductByName,
} from "./_shared";

export const transferProduct = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(transferProductSchema, input);

    // 3. RBAC — transfer'ы делают только admin/office
    assertCanTransfer(user);

    // 4. Business logic + audit в одной транзакции
    const result = await db.transaction(async (tx) => {
        // 4.1 Source: продукт должен существовать в fromLocation
        const sourceProduct = await getProductOrThrow(tx, {
            id: data.productId,
            location: data.fromLocation,
        });

        // 4.2 Destination: ищем продукт-аналог по имени, иначе создаём.
        //     measure/baseUnit/pieceToBase копируются с источника — иначе FIFO/баланс «поедут».
        let destinationProduct = await findProductByName(tx, {
            name: sourceProduct.name,
            location: data.toLocation,
        });

        if (!destinationProduct) {
            // Категория получателя: 1) явно из input, 2) одноимённая в toLocation, 3) ошибка.
            let targetCategoryId = data.targetCategoryId ?? null;

            if (!targetCategoryId) {
                const [sourceCat] = await tx
                    .select({ name: ProductCategoriesTable.name })
                    .from(ProductCategoriesTable)
                    .where(eq(ProductCategoriesTable.id, sourceProduct.categoryId))
                    .limit(1);

                if (sourceCat) {
                    const [matched] = await tx
                        .select({ id: ProductCategoriesTable.id })
                        .from(ProductCategoriesTable)
                        .where(
                            and(
                                eq(ProductCategoriesTable.location, data.toLocation),
                                eq(ProductCategoriesTable.name, sourceCat.name),
                            ),
                        )
                        .limit(1);
                    if (matched) targetCategoryId = matched.id;
                }
            }

            if (!targetCategoryId) {
                throw new ValidationError(
                    `Продукт «${sourceProduct.name}» отсутствует в получателе и одноимённая категория не найдена — укажите категорию вручную`,
                    { targetCategoryId: "Категория обязательна" },
                );
            }

            await getCategoryOrThrow(tx, {
                id: targetCategoryId,
                location: data.toLocation,
            });

            [destinationProduct] = await tx
                .insert(ProductsTable)
                .values({
                    name: sourceProduct.name,
                    categoryId: targetCategoryId,
                    location: data.toLocation,
                    measure: sourceProduct.measure,
                    baseUnit: sourceProduct.baseUnit,
                    pieceToBase: sourceProduct.pieceToBase,
                    userId: user.id,
                })
                .returning();

            await logActivity({
                tx,
                user,
                action: "create",
                entity: "product",
                entityId: destinationProduct.id,
                location: data.toLocation,
                description: `Создан продукт «${destinationProduct.name}» (через перемещение)`,
                metadata: {
                    viaTransfer: true,
                    sourceProductId: sourceProduct.id,
                    fromLocation: data.fromLocation,
                    categoryId: targetCategoryId,
                    categoryAutoMatched: !data.targetCategoryId,
                },
            });
        }

        // 4.3 FIFO-списание из источника (lock + decrement remainingBase)
        const { consumed, totalCost, singleSourceBatchId } = await consumeFifoBatches(tx, {
            productId: sourceProduct.id,
            location: data.fromLocation,
            amountBase: data.quantityBase,
        });

        // 4.4 Transfer header. destinationBatchId выставим после создания destination-партии.
        const unitCostBase = totalCost / data.quantityBase;
        const [transfer] = await tx
            .insert(StockTransfersTable)
            .values({
                productId: sourceProduct.id, // header привязан к source-продукту
                fromLocation: data.fromLocation,
                toLocation: data.toLocation,
                amountBase: String(data.quantityBase),
                totalCost: String(totalCost),
                sourceBatchId: singleSourceBatchId, // null если списано из нескольких партий
                status: "completed",
                note: data.reason ?? null,
                userId: user.id,
                userName: user.name ?? "—",
                completedAt: new Date(),
            })
            .returning();

        // 4.5 Destination-партия (одна, со взвешенной себестоимостью)
        const [destBatch] = await tx
            .insert(ProductBatchesTable)
            .values({
                productId: destinationProduct.id,
                location: data.toLocation,
                receivedBase: String(data.quantityBase),
                remainingBase: String(data.quantityBase),
                totalCost: String(totalCost),
                unitCostBase: String(unitCostBase),
                sourceBatchId: singleSourceBatchId,
                userId: user.id,
            })
            .returning();

        await tx
            .update(StockTransfersTable)
            .set({ destinationBatchId: destBatch.id })
            .where(eq(StockTransfersTable.id, transfer.id));

        // 4.6 Movements:
        //     transfer_out — по одному на каждую затронутую source-партию (трассируемость FIFO)
        //     transfer_in  — один, на destination-партию
        await tx.insert(StockMovementsTable).values([
            ...consumed.map((c) => ({
                productId: sourceProduct.id,
                batchId: c.batchId,
                location: data.fromLocation,
                type: "transfer_out",
                reason: data.reason ?? null,
                amountBase: String(c.amount),
                cost: String(c.cost),
                transferId: transfer.id,
                userId: user.id,
                userName: user.name ?? "—",
            })),
            {
                productId: destinationProduct.id,
                batchId: destBatch.id,
                location: data.toLocation,
                type: "transfer_in",
                reason: data.reason ?? null,
                amountBase: String(data.quantityBase),
                cost: String(totalCost),
                transferId: transfer.id,
                userId: user.id,
                userName: user.name ?? "—",
            },
        ]);

        // 4.7 Пересчёт балансов обеих локаций
        await recalculateBalance(tx, {
            productId: sourceProduct.id,
            location: data.fromLocation,
        });
        await recalculateBalance(tx, {
            productId: destinationProduct.id,
            location: data.toLocation,
        });

        // 4.8 Audit — одна запись на всю операцию
        await logActivity({
            tx,
            user,
            action: "stock_transfer",
            entity: "stock_transfer",
            entityId: transfer.id,
            location: data.fromLocation, // основная локация события — отправитель
            description:
                `Перемещение «${sourceProduct.name}»: ` +
                `${data.quantityBase} ${sourceProduct.baseUnit} ` +
                `${data.fromLocation} → ${data.toLocation}`,
            metadata: {
                transferId: transfer.id,
                sourceProductId: sourceProduct.id,
                destinationProductId: destinationProduct.id,
                fromLocation: data.fromLocation,
                toLocation: data.toLocation,
                amountBase: data.quantityBase,
                totalCost,
                unitCostBase,
                batchesAffected: consumed.length,
                sourceBatches: consumed.map((c) => ({
                    batchId: c.batchId,
                    amount: c.amount,
                    cost: c.cost,
                })),
                destinationBatchId: destBatch.id,
                note: data.reason ?? null,
            },
        });

        return {
            transferId: transfer.id,
            destinationProductId: destinationProduct.id,
            destinationBatchId: destBatch.id,
            totalCost,
            batchesAffected: consumed.length,
        };
    });

    // 5. Revalidate — обе локации + страница продукта + админка
    revalidatePath(`/${data.fromLocation}`);
    revalidatePath(`/${data.toLocation}`);
    revalidatePath(`/product/${data.productId}`);
    revalidatePath(`/product/${result.destinationProductId}`);
    revalidatePath("/admin");

    return result;
});