import { sql } from "drizzle-orm";
import { StockBalancesTable, ProductBatchesTable } from "@/drizzle/schema";

/**
 * Пересчитывает баланс по всем активным партиям продукта в локации.
 * Вызывать после любого изменения productBatches.
 */
export async function recalculateBalance(tx, { productId, location }) {
    // Считаем остатки на основе оставшихся партий
    const result = await tx.execute(sql`
        SELECT 
            COALESCE(SUM(remaining_base), 0) as total,
            CASE 
                WHEN SUM(remaining_base) > 0 
                THEN SUM(remaining_base * unit_cost_base) / SUM(remaining_base)
                ELSE 0 
            END as avg_cost
        FROM product_batches
        WHERE product_id = ${productId} 
          AND location = ${location}
          AND remaining_base > 0
    `);

    const { total, avg_cost } = result.rows[0];

    // UPSERT
    await tx.insert(StockBalancesTable).values({
        productId,
        location,
        totalAmount: String(total),
        avgUnitCost: String(avg_cost),
        lastMovementAt: new Date(),
    }).onConflictDoUpdate({
        target: [StockBalancesTable.productId, StockBalancesTable.location],
        set: {
            totalAmount: String(total),
            avgUnitCost: String(avg_cost),
            lastMovementAt: new Date(),
        },
    });
}