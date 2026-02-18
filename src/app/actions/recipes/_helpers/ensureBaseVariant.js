"use server";

import { db } from "@/drizzle/db";
import { and, eq } from "drizzle-orm";
import { ProductsTable, ProductVariantsTable } from "@/drizzle/schema";

/**
 * Гарантирует, что у продукта есть вариант в базовой единице (conversionToBase = 1).
 * Возвращает variantId.
 */
export async function ensureBaseVariant(tx, productId, userId, userName) {
    const [product] = await tx
        .select({
            id: ProductsTable.id,
            baseUnit: ProductsTable.baseUnit,
            name: ProductsTable.name,
        })
        .from(ProductsTable)
        .where(eq(ProductsTable.id, productId));

    if (!product) {
        throw new Error("Product not found");
    }

    const [existing] = await tx
        .select({
            id: ProductVariantsTable.id,
        })
        .from(ProductVariantsTable)
        .where(
            and(
                eq(ProductVariantsTable.productId, productId),
                eq(ProductVariantsTable.conversionToBase, "1"),
                eq(ProductVariantsTable.unit, product.baseUnit),
            ),
        );

    if (existing?.id) {
        return existing.id;
    }

    const [created] = await tx
        .insert(ProductVariantsTable)
        .values({
            productId,
            name: `Базовая единица (${product.baseUnit})`,
            unit: product.baseUnit,
            conversionToBase: "1",
            userId,
            userName,
        })
        .returning();

    return created.id;
}