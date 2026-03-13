"use server";
import { db } from "@/drizzle/db";
import { eq, and } from "drizzle-orm";
import {
	ProductsTable,
	ProductBatchesTable,
	StockMovementsTable,
} from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { toBase, inferMeasureFromUnit } from "@/lib/units";

function isMassUnit(u: string) {
	return u === "г" || u === "кг";
}
function isVolumeUnit(u: string) {
	return u === "мл" || u === "л";
}


type Unit = "г" | "кг" | "мл" | "л" | "шт";
type Measure = "mass" | "volume";

type AddProductInput = {
productId?: string | number | null;

name?: string | null;
category?: string | null;

inputUnit?: Unit | string | null;
quantity?: number | string | null;
totalCost?: number | string | null;

measure?: Measure | null;
pieceToBase?: number | string | null;

expirationDate?: string | Date | null;
};

export async function addProduct(input) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new Error("Unauthorized");

	const userId = session.user.id;
	const userName = session.user.name ?? "system";

	const productId = input.productId ? String(input.productId) : null;

	const name = String(input.name ?? "").trim();
	if (!name) throw new Error("Название обязательно");

	const category = input.category;
	if (!category) throw new Error("Категория обязательна");

	const inputUnit = String(input.inputUnit ?? "");
	if (!["г", "кг", "мл", "л", "шт"].includes(inputUnit)) {
		throw new Error("Некорректная единица ввода");
	}

	const quantity = Number(input.quantity);
	const totalCost = Number(input.totalCost);

	if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Некорректное количество");
	if (!Number.isFinite(totalCost) || totalCost < 0) throw new Error("Некорректная стоимость");

	// measure, только нужно для "шт" (и для создания нового продукта)
	const inputMeasure =
		inputUnit === "шт"
			? (input.measure === "mass" || input.measure === "volume" ? input.measure : null)
			: inferMeasureFromUnit(inputUnit); // mass|volume

	if (inputUnit === "шт" && !inputMeasure) {
		throw new Error("Для 'шт' нужно выбрать: масса (г) или объём (мл)");
	}

	// pieceToBase нужно для шт
	const inputPieceToBase =
		inputUnit === "шт" && input.pieceToBase != null && input.pieceToBase !== ""
			? Number(input.pieceToBase)
			: null;

	if (inputUnit === "шт") {
		if (!Number.isFinite(inputPieceToBase) || inputPieceToBase <= 0) {
			// может быть, уже сохранено в продукте — проверим после загрузки продукта
			// здесь не throw сразу, чтобы дать шанс достать из product.pieceToBase
		}
	}

	return db.transaction(async (tx) => {
		/* ---------------------------------- */
		/* 1) FIND PRODUCT */
		/* ---------------------------------- */
		let product = null;

		if (productId) {
			product = await tx.query.ProductsTable.findFirst({
				where: and(eq(ProductsTable.id, productId), eq(ProductsTable.userId, userId)),
			});
			if (!product) throw new Error("Выбранный продукт не найден");
		} else {
			product = await tx.query.ProductsTable.findFirst({
				where: and(eq(ProductsTable.userId, userId), eq(ProductsTable.name, name)),
			});
		}

		/* ---------------------------------- */
		/* 2) CREATE PRODUCT (if needed) */
		/* ---------------------------------- */
		if (!product) {
			// Новый продукт: задаём меру строго из unit (или выбранной measure для шт)
			const measure =
				inputUnit === "шт"
					? inputMeasure // mass|volume (проверено выше)
					: inferMeasureFromUnit(inputUnit); // mass|volume

			const baseUnit = measure === "volume" ? "мл" : "г";

			// Для шт: pieceToBase обязателен для создания
			let pieceToBaseToSave = null;
			if (inputUnit === "шт") {
				if (!Number.isFinite(inputPieceToBase) || inputPieceToBase <= 0) {
					throw new Error("Для 'шт' нужно указать: 1 шт = X (г или мл)");
				}
				pieceToBaseToSave = String(inputPieceToBase);
			}

			const [created] = await tx
				.insert(ProductsTable)
				.values({
					name,
					category,
					measure,
					baseUnit,
					pieceToBase: pieceToBaseToSave,
					userId,
					userName,
				})
				.returning();

			product = created;
		}

		/* ---------------------------------- */
		/* 3) VALIDATE UNIT vs PRODUCT MEASURE */
		/* ---------------------------------- */

		// Если ввод НЕ шт — мера однозначна по unit
		if (inputUnit !== "шт") {
			const movementMeasure = isVolumeUnit(inputUnit) ? "volume" : "mass";

			if (product.measure !== movementMeasure) {
				const productHint =
					product.measure === "volume" ? "мл/л (или шт→мл)" : "г/кг (или шт→г)";
				const enteredHint = movementMeasure === "volume" ? "мл/л" : "г/кг";
				throw new Error(
					`Несовместимая единица. Продукт измеряется как ${productHint}, а вы ввели ${enteredHint}.`
				);
			}
		} else {
			// inputUnit === "шт"
			// мера должна совпадать с мерой продукта
			if (product.measure !== inputMeasure) {
				const prod = product.measure === "volume" ? "объём (мл)" : "масса (г)";
				const entered = inputMeasure === "volume" ? "объём (мл)" : "масса (г)";
				throw new Error(
					`Несовместимо: продукт = ${prod}, а для 'шт' выбрано = ${entered}.`
				);
			}
		}

		/* ---------------------------------- */
		/* 4) pieceToBase resolution (шт) */
		/* ---------------------------------- */
		let pieceToBaseResolved = null;

		if (inputUnit === "шт") {
			// 1) берём из input, 2) иначе из продукта
			if (Number.isFinite(inputPieceToBase) && inputPieceToBase > 0) {
				pieceToBaseResolved = inputPieceToBase;
			} else if (product.pieceToBase != null) {
				const n = Number(product.pieceToBase);
				if (Number.isFinite(n) && n > 0) pieceToBaseResolved = n;
			}

			if (!Number.isFinite(pieceToBaseResolved) || pieceToBaseResolved <= 0) {
				throw new Error("Для 'шт' нужно указать: 1 шт = X (г или мл)");
			}

			// Если у продукта не было pieceToBase — сохраняем (это полезно)
			if (!product.pieceToBase) {
				const [updated] = await tx
					.update(ProductsTable)
					.set({ pieceToBase: String(pieceToBaseResolved) })
					.where(eq(ProductsTable.id, product.id))
					.returning();
				product = updated ?? product;
			}
		}

		/* ---------------------------------- */
		/* 5) (optional) category sync */
		/* ---------------------------------- */
		// "правильно" — не даём silently менять меру/базу,
		// но category менять можно (это просто классификация).
		if (category && product.category !== category) {
			const [updated] = await tx
				.update(ProductsTable)
				.set({ category })
				.where(eq(ProductsTable.id, product.id))
				.returning();
			product = updated ?? product;
		}

		/* ---------------------------------- */
		/* 6) qtyBase + batch + movement */
		/* ---------------------------------- */

		const qtyBase = toBase({
			unit: inputUnit,
			qty: quantity,
			pieceToBase: inputUnit === "шт" ? pieceToBaseResolved : null,
		});

		if (!Number.isFinite(qtyBase) || qtyBase <= 0) {
			throw new Error("Не удалось пересчитать количество в базовую единицу");
		}

		const unitCostBase = totalCost / qtyBase;

		const [batch] = await tx
			.insert(ProductBatchesTable)
			.values({
				productId: product.id,
				receivedBase: String(qtyBase),
				totalCost: String(totalCost),
				unitCostBase: String(unitCostBase),
				expirationDate: input.expirationDate ?? null,
				userId,
				userName,
			})
			.returning();

		await tx.insert(StockMovementsTable).values({
			productId: product.id,
			batchId: batch.id,
			type: "Приход",
			amountBase: String(qtyBase),
			cost: String(totalCost),
			userId,
			userName,
		});

		return { ok: true, productId: product.id, batchId: batch.id };
	});
}