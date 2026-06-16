"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ProductsTable, StockBalancesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { requireUser } from "@/lib/auth/session";
import { parseInput } from "@/lib/utils/validation";
import { assertCanViewLocation } from "@/lib/auth/rbac";
import { LOCATIONS_LIST } from "@/lib/constants/roles";

const schema = z.object({
    location: z.enum(LOCATIONS_LIST),
});

function toNum(v, fallback = 0) {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
}

/** Остатки продуктов (склад 1) по локации: { [productId]: grams } */
export const getProductStockMap = withAction(async (input) => {
    const user = await requireUser();
    const { location } = parseInput(schema, input);
    assertCanViewLocation(user, location);

    const rows = await db
        .select({
            productId: StockBalancesTable.productId,
            totalAmount: StockBalancesTable.totalAmount,
        })
        .from(StockBalancesTable)
        .innerJoin(ProductsTable, eq(ProductsTable.id, StockBalancesTable.productId))
        .where(
            and(
                eq(StockBalancesTable.location, location),
                eq(ProductsTable.location, location),
            ),
        );

    const map = {};
    for (const r of rows) {
        map[r.productId] = toNum(r.totalAmount, 0);
    }

    return map;
});
