// actions/stock/products/_shared.js
import { z } from "zod";
import { and, eq, asc, gt, sql as dsql} from "drizzle-orm";
import { ProductsTable, ProductCategoriesTable, ProductBatchesTable } from "@/drizzle/schema";
import { ConflictError } from "@/lib/utils/errors";
import { NotFoundError } from "@/lib/utils/errors";
import { LOCATIONS_LIST } from "@/lib/constants/roles";
import {
    PRODUCT_MEASURES,
    BASE_UNITS,
    INPUT_UNITS,
} from "@/lib/constants/units";
import { STOCK_MOVEMENT_TYPES } from "@/drizzle/schemas/stock/_enums";

// ─── Базовые поля ───────────────────────────────────────────────────────────
export const uuidSchema = z.string().uuid("Некорректный UUID");

export const productNameSchema = z
    .string()
    .trim()
    .min(1, "Название обязательно")
    .max(100, "Слишком длинное название");

export const locationSchema = z.enum(LOCATIONS_LIST);
export const measureSchema = z.enum(PRODUCT_MEASURES); // "mass" | "volume" | "piece"
export const baseUnitSchema = z.enum(BASE_UNITS);      // "g" | "ml"
export const inputUnitSchema = z.enum(INPUT_UNITS);    // "g" | "kg" | "ml" | "l" | "pcs"

export const pieceToBaseSchema = z
    .number()
    .positive("1 шт должна быть > 0")
    .nullable()
    .optional();

// ─── Схема продукта (без партии) ────────────────────────────────────────────
// Используется и для создания нового продукта, и при апдейте (см. updateProductSchema ниже).
export const createProductSchema = z
    .object({
        name: productNameSchema,
        categoryId: uuidSchema,
        location: locationSchema,
        measure: measureSchema,
        baseUnit: baseUnitSchema,
        pieceToBase: pieceToBaseSchema,
    })
    .refine(
        (data) => {
            if (data.measure === "mass" && data.baseUnit !== "g") return false;
            if (data.measure === "volume" && data.baseUnit !== "ml") return false;
            return true;
        },
        {
            message: "Базовая единица не соответствует мере продукта",
            path: ["baseUnit"],
        },
    )
    .refine(
        (data) => {
            if (data.measure === "piece") {
                return data.pieceToBase != null && data.pieceToBase > 0;
            }
            return true;
        },
        {
            message: "Для штучного продукта укажите, сколько г/мл в 1 шт",
            path: ["pieceToBase"],
        },
    );

// ─── Схема апдейта продукта (имя/категория) ─────────────────────────────────
export const updateProductSchema = z.object({
    id: uuidSchema,
    name: productNameSchema,
    categoryId: uuidSchema,
});

// ─── Схема партии (общая для обеих веток addProduct) ────────────────────────
export const batchInputSchema = z.object({
    qty: z.number().positive("Количество должно быть > 0"),
    unit: inputUnitSchema,
    totalCost: z.number().nonnegative("Стоимость не может быть отрицательной"),
    expirationDate: z.coerce.date().nullable().optional(),
});

// ─── addProduct: union из двух веток ────────────────────────────────────────
// Ветка 1: приход в существующий продукт
const receiveExistingSchema = z.object({
    productId: uuidSchema,
    location: locationSchema,
    batch: batchInputSchema,
});

// Ветка 2: создание нового продукта + первая партия
const createNewSchema = createProductSchema.and(
    z.object({
        batch: batchInputSchema,
    }),
);

// Финальная: z.union сам выбирает ветку по форме payload.
// (если productId есть и валиден → 1-я ветка, иначе → 2-я)
export const addProductSchema = z.union([receiveExistingSchema, createNewSchema]);

// ─── DB Helpers ─────────────────────────────────────────────────────────────
export async function isProductNameTaken(executor, { name, location, excludeId = null }) {
    const rows = await executor
        .select({ id: ProductsTable.id })
        .from(ProductsTable)
        .where(
            and(
                eq(ProductsTable.location, location),
                eq(ProductsTable.name, name),
            ),
        )
        .limit(1);

    const found = rows[0];
    if (!found) return false;
    if (excludeId && found.id === excludeId) return false;
    return true;
}

export async function getProductOrThrow(executor, { id, location = null }) {
    const rows = await executor
        .select()
        .from(ProductsTable)
        .where(eq(ProductsTable.id, id))
        .limit(1);

    const product = rows[0];
    if (!product) throw new NotFoundError("Продукт не найден");

    if (location && product.location !== location) {
        throw new NotFoundError("Продукт не найден в этой локации");
    }
    return product;
}

export async function getCategoryOrThrow(executor, { id, location }) {
    const rows = await executor
        .select()
        .from(ProductCategoriesTable)
        .where(eq(ProductCategoriesTable.id, id))
        .limit(1);

    const category = rows[0];
    if (!category) throw new NotFoundError("Категория не найдена");

    if (category.location !== location) {
        throw new NotFoundError("Категория не принадлежит этой локации");
    }
    return category;
}

// ─── Schemas: write-off / transfer / history ────────────────────────────────

export const writeOffFifoSchema = z.object({
    location: locationSchema,
    productId: uuidSchema,
    quantityBase: z.number().positive("Количество должно быть > 0"),
    reason: z.string().trim().min(1, "Укажите причину").max(500),
});

export const transferProductSchema = z
    .object({
        fromLocation: locationSchema,
        toLocation: locationSchema,
        productId: uuidSchema,
        quantityBase: z.number().positive("Количество должно быть > 0"),
        targetCategoryId: uuidSchema.optional(),
        reason: z.string().trim().max(500).optional(),
    })
    .refine((d) => d.fromLocation !== d.toLocation, {
        message: "Локации должны различаться",
        path: ["toLocation"],
    });

export const getProductHistorySchema = z.object({
    productId: uuidSchema,
    type: z.enum(STOCK_MOVEMENT_TYPES).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    limit: z.number().int().positive().max(200).default(50),
    offset: z.number().int().nonnegative().default(0),
});

// ─── FIFO consumer (общий для write-off и transfer) ─────────────────────────

/**
 * Списывает amountBase по FIFO из активных партий продукта в локации.
 * Блокирует партии (FOR UPDATE), уменьшает remainingBase, считает себестоимость.
 *
 * @returns {Promise<{
 *   consumed: Array<{ batchId: string, amount: number, unitCostBase: number, cost: number }>,
 *   totalCost: number,
 *   singleSourceBatchId: string | null
 * }>}
 */
export async function consumeFifoBatches(tx, { productId, location, amountBase }) {
    if (!(amountBase > 0)) {
        throw new ConflictError("Количество должно быть > 0");
    }

    // Берём активные партии в порядке FIFO с блокировкой
    const batches = await tx
        .select({
            id: ProductBatchesTable.id,
            remainingBase: ProductBatchesTable.remainingBase,
            unitCostBase: ProductBatchesTable.unitCostBase,
        })
        .from(ProductBatchesTable)
        .where(
            and(
                eq(ProductBatchesTable.productId, productId),
                eq(ProductBatchesTable.location, location),
                gt(ProductBatchesTable.remainingBase, "0"),
            ),
        )
        .orderBy(asc(ProductBatchesTable.receivedAt), asc(ProductBatchesTable.id))
        .for("update");

    let remaining = amountBase;
    const consumed = [];
    let totalCost = 0;

    for (const b of batches) {
        if (remaining <= 0) break;

        const batchRemaining = Number(b.remainingBase);
        const unitCost = Number(b.unitCostBase);
        const take = Math.min(batchRemaining, remaining);
        const cost = take * unitCost;

        await tx
            .update(ProductBatchesTable)
            .set({ remainingBase: dsql`${ProductBatchesTable.remainingBase} - ${String(take)}` })
            .where(eq(ProductBatchesTable.id, b.id));

        consumed.push({ batchId: b.id, amount: take, unitCostBase: unitCost, cost });
        totalCost += cost;
        remaining -= take;
    }

    if (remaining > 1e-6) {
        // Округление: дробные «хвосты» < микро-граммa считаем нулём
        throw new ConflictError(
            `Недостаточно остатков: не хватает ${remaining.toFixed(3)} в базовых единицах`,
        );
    }

    return {
        consumed,
        totalCost,
        singleSourceBatchId: consumed.length === 1 ? consumed[0].batchId : null,
    };
}

export async function findProductByName(executor, { name, location }) {
    const rows = await executor
        .select()
        .from(ProductsTable)
        .where(
            and(
                eq(ProductsTable.location, location),
                eq(ProductsTable.name, name),
            ),
        )
        .limit(1);

    return rows[0] ?? null;
}