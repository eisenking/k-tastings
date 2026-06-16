"use server";
import { z } from "zod";
import { and, eq, gt, asc } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
    ProductsTable,
    ProductCategoriesTable,
    ProductBatchesTable,
    StockBalancesTable,
} from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { requireUser } from "@/lib/auth/session";
import { parseInput } from "@/lib/utils/validation";
import { assertCanViewLocation, isAdmin } from "@/lib/auth/rbac";
import { LOCATIONS_LIST } from "@/lib/constants/roles";

// ─── Схема входа ────────────────────────────────────────────────────────────
// "all" доступен только admin — обе локации без фильтра.
const schema = z.object({
    location: z.enum([...LOCATIONS_LIST, "all"]),
});

export const getProducts = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const { location } = parseInput(schema, input);

    // 3. RBAC
    if (location === "all") {
        if (!isAdmin(user)) {
            assertCanViewLocation(user, "all"); // бросит ForbiddenError
        }
    } else {
        assertCanViewLocation(user, location);
    }

    // 4. Business logic (read-only, без транзакции)

    // 4.1 Продукты + категория + текущий баланс (одним join'ом)
    const whereProduct =
        location === "all" ? undefined : eq(ProductsTable.location, location);

    const productsRows = await db
        .select({
            id: ProductsTable.id,
            name: ProductsTable.name,
            location: ProductsTable.location,
            measure: ProductsTable.measure,
            baseUnit: ProductsTable.baseUnit,
            pieceToBase: ProductsTable.pieceToBase,

            categoryId: ProductCategoriesTable.id,
            categoryName: ProductCategoriesTable.name,

            // Баланс может быть null, если по продукту ещё не было движений
            totalAmount: StockBalancesTable.totalAmount,
            avgUnitCost: StockBalancesTable.avgUnitCost,
        })
        .from(ProductsTable)
        .leftJoin(
            ProductCategoriesTable,
            eq(ProductsTable.categoryId, ProductCategoriesTable.id),
        )
        .leftJoin(
            StockBalancesTable,
            and(
                eq(StockBalancesTable.productId, ProductsTable.id),
                eq(StockBalancesTable.location, ProductsTable.location),
            ),
        )
        .where(whereProduct)
        .orderBy(asc(ProductsTable.name));

    if (productsRows.length === 0) return [];

    // 4.2 Активные партии (remaining > 0) — для priceBreakdown
    const whereBatch =
        location === "all"
            ? gt(ProductBatchesTable.remainingBase, "0")
            : and(
                  eq(ProductBatchesTable.location, location),
                  gt(ProductBatchesTable.remainingBase, "0"),
              );

    const batchesRows = await db
        .select({
            id: ProductBatchesTable.id,
            productId: ProductBatchesTable.productId,
            location: ProductBatchesTable.location,
            receivedAt: ProductBatchesTable.receivedAt,
            expirationDate: ProductBatchesTable.expirationDate,
            remainingBase: ProductBatchesTable.remainingBase,
            unitCostBase: ProductBatchesTable.unitCostBase,
        })
        .from(ProductBatchesTable)
        .where(whereBatch)
        .orderBy(asc(ProductBatchesTable.receivedAt));

    // 4.3 Группируем партии по продукту
    const batchesByProduct = new Map();
    for (const b of batchesRows) {
        const remainingBase = Number(b.remainingBase);
        if (!Number.isFinite(remainingBase) || remainingBase <= 0) continue;

        const unitCostBase =
            b.unitCostBase != null ? Number(b.unitCostBase) : null;

        const batchValue =
            unitCostBase != null && Number.isFinite(unitCostBase)
                ? remainingBase * unitCostBase
                : null;

        const entry = {
            batchId: b.id,
            receivedAt: b.receivedAt,
            expirationDate: b.expirationDate,
            remainingBase,
            unitCostBase,
            batchValue,
        };

        if (!batchesByProduct.has(b.productId)) {
            batchesByProduct.set(b.productId, []);
        }
        batchesByProduct.get(b.productId).push(entry);
    }

    // 4.4 Финальная сборка
    return productsRows.map((p) => {
        const breakdown = batchesByProduct.get(p.id) ?? [];

        // totalValue — сумма по партиям (точнее, чем avg × total)
        const totalValue = breakdown.reduce(
            (sum, b) => sum + (b.batchValue ?? 0),
            0,
        );

        const totalBaseQuantity =
            p.totalAmount != null ? Number(p.totalAmount) : 0;

        return {
            id: p.id,
            name: p.name,
            location: p.location,
            measure: p.measure,
            baseUnit: p.baseUnit,
            pieceToBase:
                p.pieceToBase != null ? Number(p.pieceToBase) : null,

            categoryId: p.categoryId,
            category: p.categoryName,

            totalBaseQuantity: Number(totalBaseQuantity.toFixed(3)),
            totalValue: Number(totalValue.toFixed(2)),
            avgUnitCost:
                p.avgUnitCost != null ? Number(p.avgUnitCost) : null,

            priceBreakdown: breakdown,
        };
    });
});