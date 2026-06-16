// "use server";

// import { db } from "@/drizzle/db";
// import { sql } from "drizzle-orm";
// import { StockMovementsTable } from "@/drizzle/schema";
// import { assertLocationAccess } from "@/lib/helpers/locationGuard";

// /**
//  * Списание по FIFO в пределах одной локации.
//  * 
//  * input: {
//  *   location: "pastry" | "cafe",
//  *   productId: string,
//  *   quantityBase: number,   -- в базовых единицах (г или мл)
//  *   reason: string,
//  * }
//  */
// export async function writeOffFifo(input) {
//     const { location } = input;
//     const { userId, userName } = await assertLocationAccess(location);

//     const qtyBaseToWriteOff = Number(input.quantityBase);
//     if (!Number.isFinite(qtyBaseToWriteOff) || qtyBaseToWriteOff <= 0) {
//         throw new Error("Некорректное количество");
//     }

//     const reason = String(input.reason ?? "").trim();
//     if (!reason) throw new Error("Укажите причину списания");

//     return db.transaction(async (tx) => {
//         // Берём партии только из текущей локации, у которых остаток > 0
//         const batchesRes = await tx.execute(sql`
//             SELECT
//                 b.id AS batch_id,
//                 b.received_at,
//                 b.expiration_date,
//                 b.unit_cost_base,

//                 COALESCE(SUM(
//                     CASE sm.type
//                         WHEN 'Приход' THEN sm.amount_base
//                         WHEN 'Перемещение-Приём' THEN sm.amount_base
//                         WHEN 'Списание' THEN -sm.amount_base
//                         WHEN 'Перемещение-Выдача' THEN -sm.amount_base
//                         WHEN 'Производство' THEN -sm.amount_base
//                         ELSE 0
//                     END
//                 ), 0) AS remaining_base
//             FROM product_batches b
//             LEFT JOIN stock_movements sm ON sm.batch_id = b.id
//             WHERE b.product_id = ${input.productId}
//               AND b.location = ${location}
//             GROUP BY b.id, b.received_at, b.expiration_date, b.unit_cost_base
//             HAVING COALESCE(SUM(
//                 CASE sm.type
//                     WHEN 'Приход' THEN sm.amount_base
//                     WHEN 'Перемещение-Приём' THEN sm.amount_base
//                     WHEN 'Списание' THEN -sm.amount_base
//                     WHEN 'Перемещение-Выдача' THEN -sm.amount_base
//                     WHEN 'Производство' THEN -sm.amount_base
//                     ELSE 0
//                 END
//             ), 0) > 0
//             ORDER BY b.received_at ASC, b.id ASC
//         `);

//         let remaining = qtyBaseToWriteOff;
//         const allocations = [];

//         for (const b of batchesRes.rows) {
//             if (remaining <= 0) break;

//             const batchRemaining = Number(b.remaining_base);
//             if (!Number.isFinite(batchRemaining) || batchRemaining <= 0) continue;

//             const takeBase = Math.min(batchRemaining, remaining);

//             const unitCostBase =
//                 b.unit_cost_base != null ? Number(b.unit_cost_base) : null;
//             const cost =
//                 unitCostBase != null && Number.isFinite(unitCostBase)
//                     ? takeBase * unitCostBase
//                     : null;

//             await tx.insert(StockMovementsTable).values({
//                 productId: input.productId,
//                 batchId: b.batch_id,
//                 location,
//                 type: "Списание",
//                 amountBase: String(takeBase),
//                 cost: cost != null ? String(cost) : null,
//                 reason,
//                 userId,
//                 userName,
//             });

//             allocations.push({
//                 batchId: b.batch_id,
//                 takenBase: takeBase,
//                 unitCostBase,
//                 cost,
//             });

//             remaining -= takeBase;
//         }

//         if (remaining > 0) {
//             throw new Error("Недостаточно остатка для списания (FIFO)");
//         }

//         return {
//             ok: true,
//             writtenOffBase: qtyBaseToWriteOff,
//             allocations,
//         };
//     });
// }


"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/drizzle/db";
import { StockMovementsTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";
import { recalculateBalance } from "@/lib/stock/updateBalance";

import {
    writeOffFifoSchema,
    getProductOrThrow,
    consumeFifoBatches,
} from "./_shared";

export const writeOffFifo = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(writeOffFifoSchema, input);

    // 3. RBAC
    assertCanModifyLocation(user, data.location);

    // 4. Business logic + audit в одной транзакции
    const result = await db.transaction(async (tx) => {
        // 4.1 Проверяем, что продукт есть в этой локации
        const product = await getProductOrThrow(tx, {
            id: data.productId,
            location: data.location,
        });

        // 4.2 Списание по FIFO (внутри: lock + decrement remainingBase)
        const { consumed, totalCost } = await consumeFifoBatches(tx, {
            productId: product.id,
            location: data.location,
            amountBase: data.quantityBase,
        });

        // 4.3 Movements — по одному на каждую затронутую партию (трассируемость по FIFO)
        await tx.insert(StockMovementsTable).values(
            consumed.map((c) => ({
                productId: product.id,
                batchId: c.batchId,
                location: data.location,
                type: "write_off",
                reason: data.reason,
                amountBase: String(c.amount),
                cost: String(c.cost),
                userId: user.id,
                userName: user.name ?? "—",
            })),
        );

        // 4.4 Пересчёт баланса
        await recalculateBalance(tx, {
            productId: product.id,
            location: data.location,
        });

        // 4.5 Audit (одной записью — итог по операции)
        await logActivity({
            tx,
            user,
            action: "stock_write_off",
            entity: "product",
            entityId: product.id,
            location: data.location,
            description: `Списание «${product.name}»: ${data.quantityBase} ${product.baseUnit} — ${data.reason}`,
            metadata: {
                productId: product.id,
                productName: product.name,
                amountBase: data.quantityBase,
                totalCost,
                reason: data.reason,
                batchesAffected: consumed.length,
                batches: consumed.map((c) => ({
                    batchId: c.batchId,
                    amount: c.amount,
                    cost: c.cost,
                })),
            },
        });

        return { productId: product.id, totalCost, batchesAffected: consumed.length };
    });

    // 5. Revalidate
    revalidatePath(`/${data.location}`);
    revalidatePath(`/product/${data.productId}`);
    revalidatePath("/admin");

    return result;
});