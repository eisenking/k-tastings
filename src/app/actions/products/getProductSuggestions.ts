"use server";
import { db } from "@/drizzle/db";
import { ilike, and, eq } from "drizzle-orm";
import { ProductsTable } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type ProductSuggestion = {
	id: string;
	name: string;
	category:
		| "Молочные продукты"
		| "Сухие ингредиенты"
		| "Шоколад и какао"
		| "Фрукты, ягоды и орехи"
		| "Жиры"
		| "Добавки и ароматизаторы"
		| "Прочее";
	measure: "mass" | "volume";
	baseUnit: "г" | "мл";
	pieceToBase: number | null; 
};

export async function getProductSuggestions(query: string): Promise<ProductSuggestion[]> {
	if (!query || query.length < 2) return [];

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return [];

	const rows = await db
		.select({
			id: ProductsTable.id,
			name: ProductsTable.name,
			category: ProductsTable.category,
			measure: ProductsTable.measure,
			baseUnit: ProductsTable.baseUnit,
			pieceToBase: ProductsTable.pieceToBase,
		})
		.from(ProductsTable)
		.where(
			and(
				eq(ProductsTable.userId, session.user.id),
				ilike(ProductsTable.name, `%${query}%`)
			)
		)
		.orderBy(ProductsTable.name)
		.limit(10);

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		category: row.category,
		measure: row.measure,
		baseUnit: row.baseUnit,
		pieceToBase: row.pieceToBase != null ? Number(row.pieceToBase) : null,
	}));
}