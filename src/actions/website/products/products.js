"use server";
import { db } from "@/drizzle/db";
import {
    products,
    categories, 
    subcategories,
    productsToCategories,
    productsToSubcategories,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { productFormSchema } from "@/lib/zod/website/productsSchema";
import { requireWebsiteManager } from "@/actions/website/_shared";

export async function getProducts() {
    await requireWebsiteManager();
    return db.query.products.findMany({
        orderBy: (p, { asc }) => [asc(p.sortOrder), asc(p.name)],
        with: {
            categories: { with: { category: true } },
            subcategories: { with: { subcategory: true } },
        },
    });
}

export async function getCategoriesWithSubcategories() {
    await requireWebsiteManager();
    return db.query.categories.findMany({
        with: { subcategories: true },
        orderBy: (c, { asc }) => [asc(c.name)],
    });
}

export async function createProduct(values) {
    await requireWebsiteManager();
    const parsed = productFormSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "Невалидные данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const { categoryIds, subcategoryIds, ...data } = parsed.data;

    try {
        const [created] = await db
            .insert(products)
            .values({
                ...data,
                price: data.price?.toString() ?? null,
                decorPrice: data.decorPrice?.toString() ?? null,
            })
            .returning({ id: products.id });

        if (categoryIds.length) {
            await db.insert(productsToCategories).values(
                categoryIds.map((categoryId) => ({
                    productId: created.id,
                    categoryId,
                }))
            );
        }
        if (subcategoryIds.length) {
            await db.insert(productsToSubcategories).values(
                subcategoryIds.map((subcategoryId) => ({
                    productId: created.id,
                    subcategoryId,
                }))
            );
        }

        revalidatePath("/website");
        return { success: true, data: { id: created.id } };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось создать товар" };
    }
}

export async function updateProduct(id, values) {
    await requireWebsiteManager();
    const parsed = productFormSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "Невалидные данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const { categoryIds, subcategoryIds, ...data } = parsed.data;

    try {
        await db
            .update(products)
            .set({
                ...data,
                price: data.price?.toString() ?? null,
                decorPrice: data.decorPrice?.toString() ?? null,
            })
            .where(eq(products.id, id));

        await db
            .delete(productsToCategories)
            .where(eq(productsToCategories.productId, id));
        await db
            .delete(productsToSubcategories)
            .where(eq(productsToSubcategories.productId, id));

        if (categoryIds.length) {
            await db.insert(productsToCategories).values(
                categoryIds.map((categoryId) => ({
                    productId: id,
                    categoryId,
                }))
            );
        }
        if (subcategoryIds.length) {
            await db.insert(productsToSubcategories).values(
                subcategoryIds.map((subcategoryId) => ({
                    productId: id,
                    subcategoryId,
                }))
            );
        }

        revalidatePath("/website");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось обновить товар" };
    }
}

export async function deleteProduct(id) {
    await requireWebsiteManager();
    try {
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/website");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось удалить товар" };
    }
}