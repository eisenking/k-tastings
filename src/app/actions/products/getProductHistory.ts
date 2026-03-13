"use server";
import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export type ProductHistory = {
	product: {
		id: string;
		name: string;
		category: string;
		baseUnit: string;
	};
	priceHistory: Array<{
		id: string;
		price: number;
		validFrom: Date;
	}>;
	batches: Array<{
		batchId: string;
		createdAt: Date;
		expirationDate: Date | null;

		receivedBase: number;
		remainingBase: number;

		totalCost: number | null;
		unitCostBase: number | null;
	}>;
	movements: Array<{
		id: string;
		createdAt: Date;
		type: string;

		batchId: string | null;
		amountBase: number;

		cost: number | null;
		reason: string | null;
	}>;
};

type ProductSqlRow = {
	id: string;
	name: string;
	category: string;
	baseUnit: string;
};

type PriceSqlRow = {
	id: string;
	price: string;
	validFrom: Date;
};

type BatchSqlRow = {
	batchId: string;
	createdAt: Date;
	expirationDate: Date | null;

	receivedBase: string;
	totalCost: string | null;
	unitCostBase: string | null;

	remainingBase: string;
};

type MovementSqlRow = {
	id: string;
	createdAt: Date;
	type: string;

	batchId: string | null;
	amountBase: string;

	cost: string | null;
	reason: string | null;
};

export async function getProductHistory(productId: string): Promise<ProductHistory> {
	const productRes = await db.execute<ProductSqlRow>(sql`
		SELECT
			p.id,
			p.name,
			p.category,
			p.base_unit AS "baseUnit"
		FROM products p
		WHERE p.id = ${productId}
		LIMIT 1
	`);

	const product = productRes.rows[0];
	if (!product) throw new Error("Product not found");

	const priceRes = await db.execute<PriceSqlRow>(sql`
		SELECT
			ph.id,
			ph.price,
			ph.valid_from AS "validFrom"
		FROM price_history ph
		WHERE ph.product_id = ${productId}
		ORDER BY ph.valid_from DESC, ph.id DESC
	`);

	const batchesRes = await db.execute<BatchSqlRow>(sql`
		SELECT
			b.id AS "batchId",
			b."createdAt" AS "createdAt",
			b.expiration_date AS "expirationDate",

			b.received_base AS "receivedBase",
			b.total_cost AS "totalCost",
			b.unit_cost_base AS "unitCostBase",

			COALESCE(SUM(
				CASE sm.type
					WHEN 'Приход' THEN sm.amount_base
					WHEN 'Списание' THEN -sm.amount_base
					WHEN 'Производство' THEN -sm.amount_base
					ELSE 0
				END
			), 0) AS "remainingBase"
		FROM product_batches b
		LEFT JOIN stock_movements sm ON sm.batch_id = b.id
		WHERE b.product_id = ${productId}
		GROUP BY
			b.id, b."createdAt", b.expiration_date,
			b.received_base, b.total_cost, b.unit_cost_base
		ORDER BY b."createdAt" DESC, b.id DESC
	`);

	const movementsRes = await db.execute<MovementSqlRow>(sql`
		SELECT
			sm.id,
			sm."createdAt" AS "createdAt",
			sm.type,
			sm.batch_id AS "batchId",
			sm.amount_base AS "amountBase",
			sm.cost,
			sm.reason
		FROM stock_movements sm
		WHERE sm.product_id = ${productId}
		ORDER BY sm."createdAt" DESC, sm.id DESC
	`);

	const priceHistory = priceRes.rows.map((r) => ({
		id: r.id,
		price: Number(r.price),
		validFrom: r.validFrom,
	}));

	const batches = batchesRes.rows.map((b) => ({
		batchId: b.batchId,
		createdAt: b.createdAt,
		expirationDate: b.expirationDate,

		receivedBase: Number(b.receivedBase),
		remainingBase: Number(b.remainingBase),

		totalCost: b.totalCost != null ? Number(b.totalCost) : null,
		unitCostBase: b.unitCostBase != null ? Number(b.unitCostBase) : null,
	}));

	const movements = movementsRes.rows.map((m) => ({
		id: m.id,
		createdAt: m.createdAt,
		type: m.type,

		batchId: m.batchId,
		amountBase: Number(m.amountBase),

		cost: m.cost != null ? Number(m.cost) : null,
		reason: m.reason,
	}));

	return {
		product: {
			id: product.id,
			name: product.name,
			category: product.category,
			baseUnit: product.baseUnit,
		},
		priceHistory,
		batches,
		movements,
	};
}