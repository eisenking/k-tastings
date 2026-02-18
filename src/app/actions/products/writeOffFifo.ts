"use server";

import { db } from "@/drizzle/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { StockMovementsTable } from "@/drizzle/schema";

type WriteOffInput = {
	productId: string;
	quantityBase: number; // списываем в базовой единице продукта (baseUnit)
	reason?: string;
};

type BatchRow = {
	batch_id: string;
	received_at: Date;
	expiration_date: Date | null;
	purchase_price: string | null;

	variant_id: string;
	variant_name: string;
	variant_unit: string;
	conversion_to_base: string;

	remaining_base: string; // numeric -> string
};

export async function writeOffFifo(input: WriteOffInput) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const qtyBaseToWriteOff = Number(input.quantityBase);
	if (!Number.isFinite(qtyBaseToWriteOff) || qtyBaseToWriteOff <= 0) {
		throw new Error("Некорректное количество");
	}

	return db.transaction(async (tx) => {
		// 1) Берём партии FIFO (по received_at), считаем остаток по каждой партии в baseUnit
		const batches = await tx.execute<BatchRow>(sql`
			SELECT
				b.id AS batch_id,
				b.received_at,
				b.expiration_date,
				b.purchase_price,

				v.id AS variant_id,
				v.name AS variant_name,
				v.unit AS variant_unit,
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
			WHERE b.product_id = ${input.productId}
			GROUP BY
				b.id, b.received_at, b.expiration_date, b.purchase_price,
				v.id, v.name, v.unit, v.conversion_to_base
			HAVING COALESCE(SUM(
				CASE sm.type
					WHEN 'Приход' THEN sm.quantity_base
					WHEN 'Списание' THEN -sm.quantity_base
					WHEN 'Производство' THEN -sm.quantity_base
					ELSE 0
				END
			), 0) > 0
			ORDER BY b.received_at ASC, b.id ASC
		`);

		let remainingToWriteOff = qtyBaseToWriteOff;

		// Для отчёта/интерфейса вернём, как списали
		const allocations: Array<{
			batchId: string;
			variantId: string;
			variantName: string;
			unit: string;
			quantity: number;
			quantityBase: number;
			purchasePrice: number | null;
		}> = [];

		for (const b of batches.rows) {
			if (remainingToWriteOff <= 0) break;

			const batchRemainingBase = Number(b.remaining_base);
			if (batchRemainingBase <= 0) continue;

			const takeBase = Math.min(batchRemainingBase, remainingToWriteOff);

			const conversion = Number(b.conversion_to_base);
			if (!Number.isFinite(conversion) || conversion <= 0) {
				throw new Error(`Некорректная конверсия варианта ${b.variant_id}`);
			}

			// Сколько это в единицах variant.unit
			const takeQty = takeBase / conversion;

			// 2) Пишем движение списания, привязанное к batchId (важно для FIFO-истории)
			await tx.insert(StockMovementsTable).values({
				productId: input.productId,
				variantId: b.variant_id,
				batchId: b.batch_id,
				type: "Списание",
				quantity: String(takeQty),
				quantityBase: String(takeBase),
				reason: input.reason ?? null,
				userId: session.user.id,
				userName: session.user.name ?? "system",
			});

			allocations.push({
				batchId: b.batch_id,
				variantId: b.variant_id,
				variantName: b.variant_name,
				unit: b.variant_unit,
				quantity: takeQty,
				quantityBase: takeBase,
				purchasePrice: b.purchase_price ? Number(b.purchase_price) : null,
			});

			remainingToWriteOff -= takeBase;
		}

		if (remainingToWriteOff > 0) {
			throw new Error("Недостаточно остатка для списания (FIFO)");
		}

		return {
			ok: true,
			writtenOffBase: qtyBaseToWriteOff,
			allocations,
		};
	});
}