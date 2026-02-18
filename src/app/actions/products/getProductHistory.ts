// "use server";

// import { db } from "@/drizzle/db";
// import { sql } from "drizzle-orm";

// export type ProductHistory = {
// 	product: {
// 		id: string;
// 		name: string;
// 		type: string;
// 		baseUnit: string;
// 	};
// 	priceHistory: Array<{
// 		id: string;
// 		price: number;
// 		validFrom: Date;
// 	}>;
// 	batches: Array<{
// 		batchId: string;
// 		receivedAt: Date;
// 		expirationDate: Date | null;
// 		purchasePrice: number | null;

// 		variantId: string;
// 		variantName: string;
// 		unit: string;
// 		conversionToBase: number;

// 		remainingBase: number;
// 	}>;
// 	movements: Array<{
// 		id: string;
// 		createdAt: Date;
// 		type: string;

// 		variantId: string;
// 		variantName: string;
// 		unit: string;

// 		batchId: string | null;
// 		quantity: number;
// 		quantityBase: number;
// 		reason: string | null;

// 		// для анализа FIFO-себестоимости
// 		purchasePrice: number | null;
// 		cost: number | null; // purchasePrice * quantity (в unit партии) или purchasePrice * quantity? (см. ниже)
// 	}>;
// };

// type ProductRow = {
// 	id: string;
// 	name: string;
// 	type: string;
// 	base_unit: string;
// };

// type PriceRow = {
// 	id: string;
// 	price: string;
// 	valid_from: Date;
// };

// type BatchRow = {
// 	batch_id: string;
// 	receivedAt: Date;
// 	expiration_date: Date | null;
// 	purchase_price: string | null;

// 	variant_id: string;
// 	variant_name: string;
// 	unit: string;
// 	conversion_to_base: string;

// 	remaining_base: string;
// };

// type MovementRow = {
// 	id: string;
// 	createdAt: Date;
// 	type: string;

// 	variant_id: string;
// 	variant_name: string;
// 	unit: string;

// 	batch_id: string | null;
// 	quantity: string;
// 	quantity_base: string;
// 	reason: string | null;

// 	purchase_price: string | null;
// 	conversion_to_base: string | null;
// };

// export async function getProductHistory(productId: string): Promise<ProductHistory> {
// 	const productRes = await db.execute<ProductRow>(sql`
// 		SELECT id, name, type, base_unit
// 		FROM products
// 		WHERE id = ${productId}
// 		LIMIT 1
// 	`);
// 	const product = productRes.rows[0];
// 	if (!product) {
// 		throw new Error("Product not found");
// 	}

// 	const priceRes = await db.execute<PriceRow>(sql`
// 		SELECT id, price, valid_from
// 		FROM price_history
// 		WHERE product_id = ${productId}
// 		ORDER BY valid_from DESC
// 	`);

// 	const batchesRes = await db.execute<BatchRow>(sql`
// 		SELECT
// 			b.id AS batch_id,
// 			b.receivedAt,
// 			b.expiration_date,
// 			b.purchase_price,

// 			v.id AS variant_id,
// 			v.name AS variant_name,
// 			v.unit,
// 			v.conversion_to_base,

// 			COALESCE(SUM(
// 				CASE sm.type
// 					WHEN 'Приход' THEN sm.quantity_base
// 					WHEN 'Списание' THEN -sm.quantity_base
// 					WHEN 'Производство' THEN -sm.quantity_base
// 					ELSE 0
// 				END
// 			), 0) AS remaining_base
// 		FROM product_batches b
// 		JOIN product_variants v ON v.id = b.variant_id
// 		LEFT JOIN stock_movements sm ON sm.batch_id = b.id
// 		WHERE b.product_id = ${productId}
// 		GROUP BY
// 			b.id, b.receivedAt, b.expiration_date, b.purchase_price,
// 			v.id, v.name, v.unit, v.conversion_to_base
// 		ORDER BY b.receivedAt DESC, b.id DESC
// 	`);

// 	const movementsRes = await db.execute<MovementRow>(sql`
// 		SELECT
// 			sm.id,
// 			sm.createdAt,
// 			sm.type,
// 			sm.batch_id,
// 			sm.quantity,
// 			sm.quantity_base,
// 			sm.reason,

// 			v.id AS variant_id,
// 			v.name AS variant_name,
// 			v.unit,
// 			v.conversion_to_base,

// 			b.purchase_price
// 		FROM stock_movements sm
// 		JOIN product_variants v ON v.id = sm.variant_id
// 		LEFT JOIN product_batches b ON b.id = sm.batch_id
// 		WHERE sm.product_id = ${productId}
// 		ORDER BY sm.createdAt DESC, sm.id DESC
// 	`);

// 	const priceHistory = priceRes.rows.map((r) => ({
// 		id: r.id,
// 		price: Number(r.price),
// 		validFrom: r.valid_from,
// 	}));

// 	const batches = batchesRes.rows.map((b) => ({
// 		batchId: b.batch_id,
// 		receivedAt: b.receivedAt,
// 		expirationDate: b.expiration_date,
// 		purchasePrice: b.purchase_price ? Number(b.purchase_price) : null,
// 		variantId: b.variant_id,
// 		variantName: b.variant_name,
// 		unit: b.unit,
// 		conversionToBase: Number(b.conversion_to_base),
// 		remainingBase: Number(b.remaining_base),
// 	}));

// 	const movements = movementsRes.rows.map((m) => {
// 		const qty = Number(m.quantity);
// 		const purchasePrice = m.purchase_price ? Number(m.purchase_price) : null;

// 		// Себестоимость логичнее считать в “единицах партии”:
// 		// cost = purchasePrice * qty (если purchasePrice хранится за 1 variant.unit партии)
// 		const cost = purchasePrice != null ? purchasePrice * qty : null;

// 		return {
// 			id: m.id,
// 			createdAt: m.createdAt,
// 			type: m.type,
// 			variantId: m.variant_id,
// 			variantName: m.variant_name,
// 			unit: m.unit,
// 			batchId: m.batch_id,
// 			quantity: qty,
// 			quantityBase: Number(m.quantity_base),
// 			reason: m.reason,
// 			purchasePrice,
// 			cost,
// 		};
// 	});

// 	return {
// 		product: {
// 			id: product.id,
// 			name: product.name,
// 			type: product.type,
// 			baseUnit: product.base_unit,
// 		},
// 		priceHistory,
// 		batches,
// 		movements,
// 	};
// }

"use server";

import { db } from "@/drizzle/db";
import { sql } from "drizzle-orm";

export type ProductHistory = {
	product: {
		id: string;
		name: string;
		type: string;
		baseUnit: string;
	};
	priceHistory: Array<{
		id: string;
		price: number;
		validFrom: Date;
	}>;
	batches: Array<{
		batchId: string;
		receivedAt: Date;
		expirationDate: Date | null;
		purchasePrice: number | null;

		variantId: string;
		variantName: string;
		unit: string;
		conversionToBase: number;

		remainingBase: number;
	}>;
	movements: Array<{
		id: string;
		createdAt: Date;
		type: string;

		variantId: string;
		variantName: string;
		unit: string;

		batchId: string | null;
		quantity: number;
		quantityBase: number;
		reason: string | null;

		purchasePrice: number | null;
		cost: number | null;
	}>;
};

type ProductSqlRow = {
	id: string;
	name: string;
	type: string;
	baseUnit: string;
};

type PriceSqlRow = {
	id: string;
	price: string;
	validFrom: Date;
};

type BatchSqlRow = {
	batchId: string;
	receivedAt: Date;
	expirationDate: Date | null;
	purchasePrice: string | null;

	variantId: string;
	variantName: string;
	unit: string;
	conversionToBase: string;

	remainingBase: string;
};

type MovementSqlRow = {
	id: string;
	createdAt: Date;
	type: string;

	batchId: string | null;

	variantId: string;
	variantName: string;
	unit: string;
	conversionToBase: string;

	quantity: string;
	quantityBase: string;
	reason: string | null;

	purchasePrice: string | null;
};

export async function getProductHistory(productId: string): Promise<ProductHistory> {
	/* -------------------- */
	/* PRODUCT */
	/* -------------------- */
	const productRes = await db.execute<ProductSqlRow>(sql`
		SELECT
			p.id,
			p.name,
			p.type,
			p.base_unit AS "baseUnit"
		FROM products p
		WHERE p.id = ${productId}
		LIMIT 1
	`);

	const product = productRes.rows[0];
	if (!product) {
		throw new Error("Product not found");
	}

	/* -------------------- */
	/* PRICE HISTORY */
	/* -------------------- */
	const priceRes = await db.execute<PriceSqlRow>(sql`
		SELECT
			ph.id,
			ph.price,
			ph.valid_from AS "validFrom"
		FROM price_history ph
		WHERE ph.product_id = ${productId}
		ORDER BY ph.valid_from DESC, ph.id DESC
	`);

	/* -------------------- */
	/* BATCHES + REMAINING (BASE) */
	/* -------------------- */
	const batchesRes = await db.execute<BatchSqlRow>(sql`
		SELECT
			b.id AS "batchId",
			b.received_at AS "receivedAt",
			b.expiration_date AS "expirationDate",
			b.purchase_price AS "purchasePrice",

			v.id AS "variantId",
			v.name AS "variantName",
			v.unit AS unit,
			v.conversion_to_base AS "conversionToBase",

			COALESCE(SUM(
				CASE sm.type
					WHEN 'Приход' THEN sm.quantity_base
					WHEN 'Списание' THEN -sm.quantity_base
					WHEN 'Производство' THEN -sm.quantity_base
					ELSE 0
				END
			), 0) AS "remainingBase"
		FROM product_batches b
		JOIN product_variants v ON v.id = b.variant_id
		LEFT JOIN stock_movements sm ON sm.batch_id = b.id
		WHERE b.product_id = ${productId}
		GROUP BY
			b.id, b.received_at, b.expiration_date, b.purchase_price,
			v.id, v.name, v.unit, v.conversion_to_base
		ORDER BY b.received_at DESC, b.id DESC
	`);

	/* -------------------- */
	/* MOVEMENTS */
	/* -------------------- */
	const movementsRes = await db.execute<MovementSqlRow>(sql`
		SELECT
			sm.id,
			sm."createdAt" AS "createdAt",
			sm.type,
			sm.batch_id AS "batchId",
			sm.quantity,
			sm.quantity_base AS "quantityBase",
			sm.reason,

			v.id AS "variantId",
			v.name AS "variantName",
			v.unit AS unit,
			v.conversion_to_base AS "conversionToBase",

			b.purchase_price AS "purchasePrice"
		FROM stock_movements sm
		JOIN product_variants v ON v.id = sm.variant_id
		LEFT JOIN product_batches b ON b.id = sm.batch_id
		WHERE sm.product_id = ${productId}
		ORDER BY sm."createdAt" DESC, sm.id DESC
	`);

	/* -------------------- */
	/* MAP */
	/* -------------------- */
	const priceHistory = priceRes.rows.map((r) => ({
		id: r.id,
		price: Number(r.price),
		validFrom: r.validFrom,
	}));

	const batches = batchesRes.rows.map((b) => ({
		batchId: b.batchId,
		receivedAt: b.receivedAt,
		expirationDate: b.expirationDate,
		purchasePrice: b.purchasePrice != null ? Number(b.purchasePrice) : null,

		variantId: b.variantId,
		variantName: b.variantName,
		unit: b.unit,
		conversionToBase: Number(b.conversionToBase),

		remainingBase: Number(b.remainingBase),
	}));

	const movements = movementsRes.rows.map((m) => {
		const quantity = Number(m.quantity);
		const quantityBase = Number(m.quantityBase);
		const purchasePrice = m.purchasePrice != null ? Number(m.purchasePrice) : null;

		// purchasePrice — цена за 1 unit варианта партии (как в твоём addProduct)
		const cost = purchasePrice != null ? purchasePrice * quantity : null;

		return {
			id: m.id,
			createdAt: m.createdAt,
			type: m.type,

			variantId: m.variantId,
			variantName: m.variantName,
			unit: m.unit,

			batchId: m.batchId,
			quantity,
			quantityBase,
			reason: m.reason,

			purchasePrice,
			cost,
		};
	});

	return {
		product: {
			id: product.id,
			name: product.name,
			type: product.type,
			baseUnit: product.baseUnit,
		},
		priceHistory,
		batches,
		movements,
	};
}
