import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { ProductCategoriesTable } from "@/drizzle/schema";
import { LOCATIONS_LIST } from "@/lib/constants/roles";
import { NotFoundError } from "@/lib/utils/errors";

// ─────────────────────────────────────────────────────────────────────────────
// Zod-схемы
// ─────────────────────────────────────────────────────────────────────────────

const nameSchema = z
    .string({ required_error: "Название обязательно" })
    .trim()
    .min(1, "Название не может быть пустым")
    .max(100, "Название слишком длинное (макс. 100 символов)");

const locationSchema = z.enum(LOCATIONS_LIST, {
    errorMap: () => ({ message: "Некорректная локация" }),
});

const uuidSchema = z.string().uuid("Некорректный ID");

export const createCategorySchema = z.object({
    name: nameSchema,
    location: locationSchema,
});

export const updateCategorySchema = z.object({
    id: uuidSchema,
    name: nameSchema,
});

export const archiveCategorySchema = z.object({
    id: uuidSchema,
});

export const getCategoriesSchema = z.object({
    location: locationSchema.optional(),
    includeArchived: z.boolean().optional().default(false),
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Достаёт категорию по ID или кидает NotFoundError.
 * Работает и с tx, и с обычным db.
 */
export async function getCategoryOrFail(executor, id) {
    const [row] = await executor
        .select()
        .from(ProductCategoriesTable)
        .where(eq(ProductCategoriesTable.id, id))
        .limit(1);

    if (!row) throw new NotFoundError("Категория не найдена");
    return row;
}

/**
 * Проверяет, существует ли категория с таким именем в локации.
 * Возвращает true, если занято.
 * excludeId — для update (исключаем саму себя).
 */
export async function isNameTaken(executor, { name, location, excludeId }) {
    const rows = await executor
        .select({ id: ProductCategoriesTable.id })
        .from(ProductCategoriesTable)
        .where(
            and(
                eq(ProductCategoriesTable.name, name),
                eq(ProductCategoriesTable.location, location),
            ),
        );

    if (excludeId) return rows.some((r) => r.id !== excludeId);
    return rows.length > 0;
}