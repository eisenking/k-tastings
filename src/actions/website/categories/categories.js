"use server";

import { db } from "@/drizzle/db";
import { categories, subcategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    categoryFormSchema,
    subcategoryFormSchema,
} from "@/lib/zod/website/categoriesSchema";
import { requireWebsiteManager } from "@/actions/website/_shared";

// === CATEGORIES ===

export async function createCategory(values) {
    await requireWebsiteManager();
    const parsed = categoryFormSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "Невалидные данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }
    try {
        const [created] = await db
            .insert(categories)
            .values(parsed.data)
            .returning({ id: categories.id });
        revalidatePath("/website");
        return { success: true, data: { id: created.id } };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось создать категорию (возможно, slug занят)" };
    }
}

export async function updateCategory(id, values) {
    await requireWebsiteManager();
    const parsed = categoryFormSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "Невалидные данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }
    try {
        await db.update(categories).set(parsed.data).where(eq(categories.id, id));
        revalidatePath("/website");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось обновить категорию" };
    }
}

export async function deleteCategory(id) {
    await requireWebsiteManager();
    try {
        await db.delete(categories).where(eq(categories.id, id));
        revalidatePath("/website");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось удалить категорию" };
    }
}

// === SUBCATEGORIES ===

export async function createSubcategory(values) {
    await requireWebsiteManager();
    const parsed = subcategoryFormSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "Невалидные данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }
    try {
        const [created] = await db
            .insert(subcategories)
            .values(parsed.data)
            .returning({ id: subcategories.id });
        revalidatePath("/website");
        return { success: true, data: { id: created.id } };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось создать подкатегорию (возможно, slug занят в этой категории)" };
    }
}

export async function updateSubcategory(id, values) {
    await requireWebsiteManager();
    const parsed = subcategoryFormSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "Невалидные данные",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }
    try {
        await db.update(subcategories).set(parsed.data).where(eq(subcategories.id, id));
        revalidatePath("/website");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось обновить подкатегорию" };
    }
}

export async function deleteSubcategory(id) {
    await requireWebsiteManager();
    try {
        await db.delete(subcategories).where(eq(subcategories.id, id));
        revalidatePath("/website");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Не удалось удалить подкатегорию" };
    }
}