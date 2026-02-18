"use server";
import { db } from "@/drizzle/db";
import { eq, and } from "drizzle-orm";
import {
    ProductsTable,
    ProductVariantsTable,
    ProductBatchesTable,
    StockMovementsTable,
    PriceHistoryTable,
} from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Unit = "г" | "кг" | "мл" | "л" | "шт";
type ProductType = "молочные продукты" | "сухие ингредиенты" | "жиры" | "шоколад и какао" | "фрукты, ягоды и орехи" | "добавки и ароматизаторы" | "прочее";

type AddProductInput = {
    name: string;
    type: ProductType;
    baseUnit: Unit;
    variantName: string;
    variantUnit: Unit;
    conversionToBase: number;
    quantity: number;
    price: number;
    expirationDate?: Date | null;
};

export async function addProduct(input: AddProductInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return db.transaction(async (tx) => {
        /* ---------- PRODUCT ---------- */
        let product = await tx.query.ProductsTable.findFirst({
            where: eq(ProductsTable.name, input.name),
        });

        if (!product) {
            const [created] = await tx
                .insert(ProductsTable)
                .values({
                    name: input.name,
                    type: input.type,
                    baseUnit: input.baseUnit,
                    userId: session.user.id,
                    userName: session.user.name ?? "system",
                })
                .returning();

            product = created;
        }

        /* ---------- VARIANT ---------- */
        let variant = await tx.query.ProductVariantsTable.findFirst({
            where: and(
                eq(ProductVariantsTable.productId, product.id),
                eq(ProductVariantsTable.name, input.variantName)
            ),
        });

        if (!variant) {
            const [created] = await tx
                .insert(ProductVariantsTable)
                .values({
                    productId: product.id,
                    name: input.variantName,
                    unit: input.variantUnit,
                    conversionToBase: String(input.conversionToBase),
                    userId: session.user.id,
                    userName: session.user.name ?? "system",
                })
                .returning();

            variant = created;
        }

        /* ---------- BATCH ---------- */
        const [batch] = await tx
            .insert(ProductBatchesTable)
            .values({
                productId: product.id,
                variantId: variant.id,
                purchasePrice: String(input.price),
                expirationDate: input.expirationDate ?? null,
                userId: session.user.id,
                userName: session.user.name ?? "system",
            })
            .returning();

        /* ---------- STOCK MOVEMENT ---------- */
        const quantityBase = input.quantity * input.conversionToBase;

        await tx.insert(StockMovementsTable).values({
            productId: product.id,
            variantId: variant.id,
            batchId: batch.id,
            type: "Приход",
            quantity: String(input.quantity),
            quantityBase: String(quantityBase),
            userId: session.user.id,
            userName: session.user.name ?? "system",
        });

        /* ---------- PRICE ---------- */
        await tx.insert(PriceHistoryTable).values({
            productId: product.id,
            price: String(input.price),
            userId: session.user.id,
            userName: session.user.name ?? "system",
        });

        return product;
    });
}