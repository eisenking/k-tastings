"use server";

import { db } from "@/drizzle/db";
import { ilike } from "drizzle-orm";
import { ProductsTable } from "@/drizzle/schema";

export type ProductSuggestion = {
    id: string;
    name: string;
    type: "молочные продукты" | "сухие ингредиенты" | "жиры" | "шоколад и какао" | "фрукты, ягоды и орехи" | "добавки и ароматизаторы" | "прочее";
    baseUnit: "г" | "кг" | "мл" | "л" | "шт";
};

/* -------------------- */
/* ACTION */
/* -------------------- */

export async function getProductSuggestions(
    query: string
): Promise<ProductSuggestion[]> {
    if (!query || query.length < 2) return [];

    const rows = await db
        .select({
            id: ProductsTable.id,
            name: ProductsTable.name,
            type: ProductsTable.type,
            baseUnit: ProductsTable.baseUnit,
        })
        .from(ProductsTable)
        .where(ilike(ProductsTable.name, `%${query}%`))
        .orderBy(ProductsTable.name)
        .limit(10);

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        baseUnit: row.baseUnit,
    }));
}