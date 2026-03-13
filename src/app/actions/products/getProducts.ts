"use server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export type ProductRow = {
	id: string;
	name: string;
	category: string;
	baseUnit: string;

	totalBaseQuantity: number;
	totalValue: number;

	priceBreakdown: {
		batchId: string;
		receivedAt: Date;
		expirationDate: Date | null;

		remainingBase: number;
		unitCostBase: number | null;
		batchValue: number | null;
	}[];
};

type SqlRow = {
	product_id: string;
	name: string;
	category: string;
	base_unit: string;

	total_base: string;

	batch_id: string | null;
	received_at: Date | null;
	expiration_date: Date | null;

	unit_cost_base: string | null;
	remaining_base: string | null;
};

export async function getProducts(): Promise<ProductRow[]> {
	const result = await db.execute<SqlRow>(sql`
		WITH product_totals AS (
			SELECT
				p.id AS product_id,
				p.name,
				p.category,
				p.base_unit AS base_unit,

				COALESCE(SUM(
					CASE sm.type
						WHEN 'Приход' THEN sm.amount_base
						WHEN 'Списание' THEN -sm.amount_base
						WHEN 'Производство' THEN -sm.amount_base
						ELSE 0
					END
				), 0) AS total_base
			FROM products p
			LEFT JOIN stock_movements sm ON sm.product_id = p.id
			GROUP BY p.id, p.name, p.category, p.base_unit
		),
		batch_remaining AS (
			SELECT
				b.product_id,
				b.id AS batch_id,
				b.received_at,
				b.expiration_date,
				b.unit_cost_base,

				COALESCE(SUM(
					CASE sm.type
						WHEN 'Приход' THEN sm.amount_base
						WHEN 'Списание' THEN -sm.amount_base
						WHEN 'Производство' THEN -sm.amount_base
						ELSE 0
					END
				), 0) AS remaining_base
			FROM product_batches b
			LEFT JOIN stock_movements sm ON sm.batch_id = b.id
			GROUP BY
				b.product_id,
				b.id, b.received_at, b.expiration_date,
				b.unit_cost_base
		)
		SELECT
			pt.product_id,
			pt.name,
			pt.category,
			pt.base_unit,
			pt.total_base,

			br.batch_id,
			br.received_at,
			br.expiration_date,
			br.unit_cost_base,
			br.remaining_base
		FROM product_totals pt
		LEFT JOIN batch_remaining br ON br.product_id = pt.product_id
		ORDER BY pt.name, br.received_at
	`);

	const map = new Map<string, ProductRow>();

	for (const row of result.rows) {
		if (!map.has(row.product_id)) {
			map.set(row.product_id, {
				id: row.product_id,
				name: row.name,
				category: row.category,
				baseUnit: row.base_unit,
				totalBaseQuantity: Number(row.total_base),
				totalValue: 0,
				priceBreakdown: [],
			});
		}

		const product = map.get(row.product_id)!;

		if (row.batch_id && row.received_at) {
			const remainingBase = row.remaining_base != null ? Number(row.remaining_base) : 0;
			const unitCostBase = row.unit_cost_base != null ? Number(row.unit_cost_base) : null;

			if (Number.isFinite(remainingBase) && remainingBase > 0) {
				const batchValue =
					unitCostBase != null && Number.isFinite(unitCostBase)
						? remainingBase * unitCostBase
						: null;

				product.priceBreakdown.push({
					batchId: row.batch_id,
					receivedAt: row.received_at,
					expirationDate: row.expiration_date,
					remainingBase,
					unitCostBase,
					batchValue,
				});

				if (batchValue != null && Number.isFinite(batchValue)) {
					product.totalValue += batchValue;
				}
			}
		}
	}

	for (const p of map.values()) {
		p.totalValue = Number(p.totalValue.toFixed(2));
		p.totalBaseQuantity = Number(Number(p.totalBaseQuantity).toFixed(3));
	}

	return Array.from(map.values());
}