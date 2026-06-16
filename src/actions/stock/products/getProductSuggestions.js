"use server";
import { z } from "zod";
import { and, eq, ilike, asc } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ProductsTable, ProductCategoriesTable } from "@/drizzle/schema";
import { withAction } from "@/lib/utils/action-response";
import { requireUser } from "@/lib/auth/session";
import { parseInput } from "@/lib/utils/validation";
import { assertCanViewLocation } from "@/lib/auth/rbac";
import { LOCATIONS_LIST } from "@/lib/constants/roles";

const schema = z.object({
    query: z.string().trim().min(2, "Минимум 2 символа"),
    location: z.enum(LOCATIONS_LIST),
    limit: z.number().int().positive().max(50).optional().default(10),
});

export const getProductSuggestions = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const { query, location, limit } = parseInput(schema, input);

    // 3. RBAC
    assertCanViewLocation(user, location);

    // 4. Query
    const rows = await db
        .select({
            id: ProductsTable.id,
            name: ProductsTable.name,
            categoryId: ProductsTable.categoryId,
            categoryName: ProductCategoriesTable.name,
            measure: ProductsTable.measure,
            baseUnit: ProductsTable.baseUnit,
            pieceToBase: ProductsTable.pieceToBase,
        })
        .from(ProductsTable)
        .leftJoin(
            ProductCategoriesTable,
            eq(ProductsTable.categoryId, ProductCategoriesTable.id),
        )
        .where(
            and(
                eq(ProductsTable.location, location),
                ilike(ProductsTable.name, `%${query}%`),
            ),
        )
        .orderBy(asc(ProductsTable.name))
        .limit(limit);

    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        categoryId: r.categoryId,
        category: r.categoryName,
        measure: r.measure,
        baseUnit: r.baseUnit,
        pieceToBase: r.pieceToBase != null ? Number(r.pieceToBase) : null,
    }));
});