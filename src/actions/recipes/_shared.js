// actions/recipes/_shared.js
import { z } from "zod";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import {
    RecipesTable,
    RecipeItemsTable,
    ProductsTable,
    ProductionBatchesTable,
} from "@/drizzle/schema";

import {
    RECIPE_TYPES,
    RECIPE_CATEGORIES,
    RECIPE_CATEGORIES_BY_CONTEXT,
} from "@/drizzle/schemas/recipes/_enums";
import { LOCATIONS } from "@/lib/constants/roles";
import {
    NotFoundError,
    ConflictError,
    ValidationError,
} from "@/lib/utils/errors";

// ─────────────────────────────────────────────────────────────────────────────
// Zod схемы
// ─────────────────────────────────────────────────────────────────────────────

// Простой ингредиент — продукт со склада
const simpleProductItemSchema = z.object({
    productId: z.string().uuid(),
    amountBase: z.coerce.number().positive("Количество должно быть > 0"),
});

// Простой ингредиент — существующая заготовка (склад 2)
const simpleRecipeItemSchema = z.object({
    childRecipeId: z.string().uuid(),
    amountBase: z.coerce.number().positive("Количество должно быть > 0"),
});

const simpleItemSchema = z.union([simpleProductItemSchema, simpleRecipeItemSchema]);

// Группа сложного ингредиента — на лету создаваемая заготовка
const complexGroupSchema = z.object({
    name: z.string().trim().min(1, "Название заготовки обязательно"),
    category: z.enum(RECIPE_CATEGORIES),
    items: z
        .array(simpleProductItemSchema)
        .min(1, "В заготовке должен быть хотя бы один продукт"),
});

const baseRecipeFields = {
    name: z.string().trim().min(1, "Название обязательно"),
    type: z.enum(RECIPE_TYPES),
    location: z.enum(Object.values(LOCATIONS)),
    defaultYieldBase: z.coerce.number().positive("Выход должен быть > 0"),
    category: z.enum(RECIPE_CATEGORIES).nullable().optional(),
    note: z.string().trim().nullable().optional(),
    simpleItems: z.array(simpleItemSchema).optional().default([]),
    complexGroups: z.array(complexGroupSchema).optional().default([]),
};

export const createRecipeSchema = z.object(baseRecipeFields).superRefine(validateTypeCategory);

// В update запрещаем менять type/location (см. § 3 договорённостей)
export const updateRecipeSchema = z
    .object({
        recipeId: z.string().uuid(),
        name: baseRecipeFields.name,
        defaultYieldBase: baseRecipeFields.defaultYieldBase,
        category: baseRecipeFields.category,
        note: baseRecipeFields.note,
        simpleItems: baseRecipeFields.simpleItems,
        complexGroups: baseRecipeFields.complexGroups,
    });

export const archiveRecipeSchema = z.object({
    recipeId: z.string().uuid(),
    archive: z.boolean(), // true — архивировать, false — разархивировать
});

export const produceRecipeSchema = z.object({
    recipeId: z.string().uuid(),
    amountBase: z.coerce.number().positive("Количество должно быть > 0"),
    expirationDate: z.coerce.date().nullable().optional(),
    note: z.string().trim().nullable().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Кастомные валидации
// ─────────────────────────────────────────────────────────────────────────────

function validateTypeCategory(data, ctx) {
    // filling — без категории; preparation/dish — категория обязательна и соответствует контексту
    if (data.type === "filling") {
        if (data.category) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["category"],
                message: "У начинок не должно быть категории",
            });
        }
        return;
    }

    if (!data.category) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["category"],
            message: "Категория обязательна",
        });
        return;
    }

    const allowed = RECIPE_CATEGORIES_BY_CONTEXT[`${data.location}:${data.type}`] ?? [];
    if (!allowed.includes(data.category)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["category"],
            message: "Категория не подходит для этого типа и локации",
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Доменные хелперы
// ─────────────────────────────────────────────────────────────────────────────

export async function getRecipeOrThrow(tx, { id, location }) {
    const [recipe] = await tx
        .select()
        .from(RecipesTable)
        .where(eq(RecipesTable.id, id))
        .limit(1);

    if (!recipe) throw new NotFoundError("Рецепт не найден");
    if (location && recipe.location !== location) {
        throw new NotFoundError("Рецепт не найден в этой локации");
    }
    return recipe;
}

export async function assertRecipeNameAvailable(
    tx,
    { name, type, location, excludeId = null },
) {
    const conditions = [
        eq(RecipesTable.name, name),
        eq(RecipesTable.type, type),
        eq(RecipesTable.location, location),
    ];
    if (excludeId) conditions.push(ne(RecipesTable.id, excludeId));

    const [existing] = await tx
        .select({ id: RecipesTable.id })
        .from(RecipesTable)
        .where(and(...conditions))
        .limit(1);

    if (existing) {
        throw new ConflictError("Рецепт с таким названием уже есть в этой локации");
    }
}

/** Проверка: все продукты существуют и принадлежат указанной локации. */
export async function assertProductsBelongToLocation(tx, { productIds, location }) {
    if (productIds.length === 0) return;
    const rows = await tx
        .select({ id: ProductsTable.id, location: ProductsTable.location })
        .from(ProductsTable)
        .where(inArray(ProductsTable.id, productIds));

    if (rows.length !== productIds.length) {
        throw new ValidationError("Один или несколько продуктов не найдены");
    }
    const wrong = rows.find((r) => r.location !== location);
    if (wrong) {
        throw new ValidationError(
            "Все продукты должны принадлежать той же локации, что и рецепт",
        );
    }
}

/** Проверка: все подрецепты существуют, принадлежат локации и не архивированы. */
export async function assertChildRecipesValid(
    tx,
    { childRecipeIds, location, parentRecipeId = null },
) {
    if (childRecipeIds.length === 0) return;

    const rows = await tx
        .select({
            id: RecipesTable.id,
            location: RecipesTable.location,
            type: RecipesTable.type,
            isArchived: RecipesTable.isArchived,
        })
        .from(RecipesTable)
        .where(inArray(RecipesTable.id, childRecipeIds));

    if (rows.length !== childRecipeIds.length) {
        throw new ValidationError("Один или несколько подрецептов не найдены");
    }

    for (const r of rows) {
        if (r.location !== location) {
            throw new ValidationError("Подрецепт должен быть той же локации");
        }
        if (r.isArchived) {
            throw new ValidationError("Нельзя использовать архивный подрецепт");
        }
        if (r.type !== "preparation") {
            // Логика: ингредиентом может быть только заготовка
            // (нельзя вложить начинку в начинку или блюдо в блюдо).
            throw new ValidationError("Ингредиентом может быть только заготовка");
        }
        if (parentRecipeId && r.id === parentRecipeId) {
            throw new ValidationError("Рецепт не может ссылаться сам на себя");
        }
    }
}

/** Список рецептов, которые активно используют данный рецепт как childRecipeId. */
export async function findActiveUsages(tx, { recipeId }) {
    const rows = await tx
        .select({
            id: RecipesTable.id,
            name: RecipesTable.name,
        })
        .from(RecipeItemsTable)
        .innerJoin(RecipesTable, eq(RecipesTable.id, RecipeItemsTable.recipeId))
        .where(
            and(
                eq(RecipeItemsTable.childRecipeId, recipeId),
                eq(RecipeItemsTable.refType, "recipe"),
                eq(RecipesTable.isArchived, false),
            ),
        );
    return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// Утилиты
// ─────────────────────────────────────────────────────────────────────────────

export function round6(n) {
    return Math.round(Number(n) * 1e6) / 1e6;
}

export function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Создаёт items главного рецепта: разворачивает complexGroups в подрецепты,
 * затем добавляет ссылки на них + simpleItems в parent.
 *
 * Возвращает массив созданных подрецептов (для аудита).
 */
export async function buildRecipeItems(
    tx,
    { parentRecipeId, location, simpleItems, complexGroups, user },
) {
    const createdSubRecipes = [];

    const productIds = [
        ...simpleItems.filter((i) => i.productId).map((i) => i.productId),
        ...complexGroups.flatMap((g) => g.items.map((i) => i.productId)),
    ];
    const childRecipeIds = simpleItems
        .filter((i) => i.childRecipeId)
        .map((i) => i.childRecipeId);

    await assertProductsBelongToLocation(tx, {
        productIds,
        location,
    });

    if (childRecipeIds.length > 0) {
        await assertChildRecipesValid(tx, {
            childRecipeIds,
            location,
            parentRecipeId,
        });
    }

    // 2) Создаём подрецепты из complexGroups
    for (const group of complexGroups) {
        const sumBase = group.items.reduce((acc, it) => acc + Number(it.amountBase), 0);

        // Проверка уникальности имени подрецепта (preparation)
        await assertRecipeNameAvailable(tx, {
            name: group.name,
            type: "preparation",
            location,
        });

        const [sub] = await tx
            .insert(RecipesTable)
            .values({
                name: group.name,
                type: "preparation",
                location,
                category: group.category,
                defaultYieldBase: String(round6(sumBase)),
                userId: user.id,
            })
            .returning();

        // items подрецепта (только продукты)
        await tx.insert(RecipeItemsTable).values(
            group.items.map((it) => ({
                recipeId: sub.id,
                refType: "product",
                productId: it.productId,
                amountBase: String(round6(it.amountBase)),
                userId: user.id,
            })),
        );

        // Ссылка из главного рецепта на подрецепт
        await tx.insert(RecipeItemsTable).values({
            recipeId: parentRecipeId,
            refType: "recipe",
            childRecipeId: sub.id,
            amountBase: String(round6(sumBase)),
            userId: user.id,
        });

        createdSubRecipes.push(sub);
    }

    // 3) Простые ингредиенты parent-рецепта (продукты + ссылки на заготовки)
    if (simpleItems.length > 0) {
        await tx.insert(RecipeItemsTable).values(
            simpleItems.map((it) => {
                if (it.childRecipeId) {
                    return {
                        recipeId: parentRecipeId,
                        refType: "recipe",
                        childRecipeId: it.childRecipeId,
                        amountBase: String(round6(it.amountBase)),
                        userId: user.id,
                    };
                }
                return {
                    recipeId: parentRecipeId,
                    refType: "product",
                    productId: it.productId,
                    amountBase: String(round6(it.amountBase)),
                    userId: user.id,
                };
            }),
        );
    }

    return createdSubRecipes;
}