// "use server";
// import { db } from "@/drizzle/db";
// import { sql } from "drizzle-orm";

// export type ProductRow = {
//     id: string;
//     name: string;
//     type: string;
//     baseUnit: string;
//     totalBaseQuantity: number;
//     price: number;
//     breakdown: {
//         variantId: string;
//         variantName: string;
//         unit: string;
//         quantity: number;
//         quantityBase: number;
//     }[];
// };

// type SqlRow = {
//     product_id: string;
//     name: string;
//     type: string;
//     base_unit: string;
//     variant_id: string | null;
//     variant_name: string | null;
//     unit: string | null;
//     quantity: string | null;
//     quantity_base: string | null;
//     price: string | null;
// };

// export async function getProducts(): Promise<ProductRow[]> {
//     const result = await db.execute<SqlRow>(sql`
//         SELECT
//             p.id AS product_id,
//             p.name,
//             p.type,
//             p.base_unit,

//             v.id AS variant_id,
//             v.name AS variant_name,
//             v.unit,

//             SUM(
//                 CASE sm.type
//                     WHEN 'Приход' THEN sm.quantity
//                     WHEN 'Списание' THEN -sm.quantity
//                     WHEN 'Производство' THEN -sm.quantity
//                     ELSE 0
//                 END
//             ) AS quantity,

//             SUM(
//                 CASE sm.type
//                     WHEN 'Приход' THEN sm.quantity_base
//                     WHEN 'Списание' THEN -sm.quantity_base
//                     WHEN 'Производство' THEN -sm.quantity_base
//                     ELSE 0
//                 END
//             ) AS quantity_base,

//             (
//                 SELECT ph.price
//                 FROM price_history ph
//                 WHERE ph.product_id = p.id
//                 ORDER BY ph.valid_from DESC
//                 LIMIT 1
//             ) AS price

//         FROM products p
//         LEFT JOIN product_variants v ON v.product_id = p.id
//         LEFT JOIN stock_movements sm ON sm.variant_id = v.id

//         GROUP BY
//             p.id,
//             p.name,
//             p.type,
//             p.base_unit,
//             v.id,
//             v.name,
//             v.unit

//         ORDER BY p.name
//     `);

//     const map = new Map<string, ProductRow>();

//     for (const row of result.rows) {
//         if (!map.has(row.product_id)) {
//             map.set(row.product_id, {
//                 id: row.product_id,
//                 name: row.name,
//                 type: row.type,
//                 baseUnit: row.base_unit,
//                 totalBaseQuantity: 0,
//                 price: row.price ? Number(row.price) : 0,
//                 breakdown: [],
//             });
//         }

//         if (!row.variant_id || !row.quantity || !row.quantity_base) {
//             continue;
//         }

//         const product = map.get(row.product_id)!;

//         const qty = Number(row.quantity);
//         const qtyBase = Number(row.quantity_base);

//         if (qty !== 0) {
//             product.breakdown.push({
//                 variantId: row.variant_id,
//                 variantName: row.variant_name!,
//                 unit: row.unit!,
//                 quantity: qty,
//                 quantityBase: qtyBase,
//             });

//             product.totalBaseQuantity += qtyBase;
//         }
//     }

//     return Array.from(map.values());
// }


"use server";

import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export type ProductRow = {
    id: string;
    name: string;
    type: string;
    baseUnit: string;

    totalBaseQuantity: number;

    // 👇 общая стоимость остатка (сумма по партиям)
    totalValue: number;

    breakdown: {
        variantId: string;
        variantName: string;
        unit: string;
        quantity: number;
        quantityBase: number;
    }[];

    // 👇 разбивка стоимости по партиям (для tooltip)
    priceBreakdown: {
        batchId: string;
        receivedAt: Date;
        expirationDate: Date | null;

        variantId: string;
        variantName: string;
        unit: string;
        conversionToBase: number;

        remainingBase: number;

        purchasePrice: number | null;     // цена за 1 unit варианта
        unitCostBase: number | null;      // цена за 1 baseUnit
        batchValue: number | null;        // стоимость остатка партии
    }[];
};

type SqlRow = {
    product_id: string;
    name: string;
    type: string;
    base_unit: string;

    variant_id: string | null;
    variant_name: string | null;
    unit: string | null;

    quantity: string | null;
    quantity_base: string | null;

    batch_id: string | null;
    received_at: Date | null;
    expiration_date: Date | null;
    purchase_price: string | null;

    conversion_to_base: string | null;
    remaining_base: string | null;
};

export async function getProducts(): Promise<ProductRow[]> {
    const result = await db.execute<SqlRow>(sql`
        WITH variant_totals AS (
            SELECT
                p.id AS product_id,
                p.name,
                p.type,
                p.base_unit,

                v.id AS variant_id,
                v.name AS variant_name,
                v.unit,

                SUM(
                    CASE sm.type
                        WHEN 'Приход' THEN sm.quantity
                        WHEN 'Списание' THEN -sm.quantity
                        WHEN 'Производство' THEN -sm.quantity
                        ELSE 0
                    END
                ) AS quantity,

                SUM(
                    CASE sm.type
                        WHEN 'Приход' THEN sm.quantity_base
                        WHEN 'Списание' THEN -sm.quantity_base
                        WHEN 'Производство' THEN -sm.quantity_base
                        ELSE 0
                    END
                ) AS quantity_base
            FROM products p
            LEFT JOIN product_variants v ON v.product_id = p.id
            LEFT JOIN stock_movements sm ON sm.variant_id = v.id
            GROUP BY
                p.id, p.name, p.type, p.base_unit,
                v.id, v.name, v.unit
        ),
        batch_remaining AS (
            SELECT
                b.product_id,
                b.id AS batch_id,
                b.received_at,
                b.expiration_date,
                b.purchase_price,

                v.id AS variant_id,
                v.name AS variant_name,
                v.unit,
                v.conversion_to_base,

                COALESCE(SUM(
                    CASE sm.type
                        WHEN 'Приход' THEN sm.quantity_base
                        WHEN 'Списание' THEN -sm.quantity_base
                        WHEN 'Производство' THEN -sm.quantity_base
                        ELSE 0
                    END
                ), 0) AS remaining_base
            FROM product_batches b
            JOIN product_variants v ON v.id = b.variant_id
            LEFT JOIN stock_movements sm ON sm.batch_id = b.id
            GROUP BY
                b.product_id,
                b.id, b.received_at, b.expiration_date, b.purchase_price,
                v.id, v.name, v.unit, v.conversion_to_base
        )
        SELECT
            vt.product_id,
            vt.name,
            vt.type,
            vt.base_unit,

            vt.variant_id,
            vt.variant_name,
            vt.unit,
            vt.quantity,
            vt.quantity_base,

            br.batch_id,
            br.received_at,
            br.expiration_date,
            br.purchase_price,
            br.conversion_to_base,
            br.remaining_base

        FROM variant_totals vt
        LEFT JOIN batch_remaining br
            ON br.product_id = vt.product_id
            AND br.variant_id = vt.variant_id

        ORDER BY vt.name, vt.variant_name, br.received_at
    `);

    const map = new Map<string, ProductRow>();

    for (const row of result.rows) {
        if (!map.has(row.product_id)) {
            map.set(row.product_id, {
                id: row.product_id,
                name: row.name,
                type: row.type,
                baseUnit: row.base_unit,
                totalBaseQuantity: 0,
                totalValue: 0,
                breakdown: [],
                priceBreakdown: [],
            });
        }

        const product = map.get(row.product_id)!;

        // ------- breakdown по вариантам (как у тебя было) -------
        if (row.variant_id && row.quantity && row.quantity_base) {
            const qty = Number(row.quantity);
            const qtyBase = Number(row.quantity_base);

            // чтобы не дублировать один и тот же variant breakdown из-за join на batches,
            // добавим простой guard: пушим variant breakdown только один раз на variant_id
            const alreadyHasVariant = product.breakdown.some((b) => b.variantId === row.variant_id);
            if (!alreadyHasVariant && qty !== 0) {
                product.breakdown.push({
                    variantId: row.variant_id,
                    variantName: row.variant_name ?? "",
                    unit: row.unit ?? "",
                    quantity: qty,
                    quantityBase: qtyBase,
                });
            }

            // totalBaseQuantity считаем как сумму quantityBase по вариантам (тоже без дублей)
            // возьмём из breakdown потом, но проще так: пересчитаем после цикла
        }

        // ------- стоимость по партиям -------
        if (row.batch_id && row.received_at && row.conversion_to_base && row.remaining_base) {
            const remainingBase = Number(row.remaining_base);
            const conversionToBase = Number(row.conversion_to_base);

            // пропускаем нулевые/отрицательные партии
            if (remainingBase > 0 && Number.isFinite(conversionToBase) && conversionToBase > 0) {
                const purchasePrice = row.purchase_price ? Number(row.purchase_price) : null; // за 1 unit варианта
                const unitCostBase =
                    purchasePrice !== null ? purchasePrice / conversionToBase : null;

                const batchValue =
                    unitCostBase !== null ? remainingBase * unitCostBase : null;

                product.priceBreakdown.push({
                    batchId: row.batch_id,
                    receivedAt: row.received_at,
                    expirationDate: row.expiration_date,

                    variantId: row.variant_id ?? "",
                    variantName: row.variant_name ?? "",
                    unit: row.unit ?? "",
                    conversionToBase,

                    remainingBase,
                    purchasePrice,
                    unitCostBase,
                    batchValue,
                });

                if (batchValue !== null && Number.isFinite(batchValue)) {
                    product.totalValue += batchValue;
                }
            }
        }
    }

    // пересчёт totalBaseQuantity (без дублей и без влияния join на партии)
    for (const product of map.values()) {
        product.totalBaseQuantity = product.breakdown.reduce((acc, b) => acc + Number(b.quantityBase), 0);
        // можно округлять, если надо
        product.totalValue = Number(product.totalValue.toFixed(2));
    }

    return Array.from(map.values());
}
