// "use server";

// import { db } from "@/drizzle/db";
// import { eq, and, isNull, asc } from "drizzle-orm";
// import { ProductCategoriesTable } from "@/drizzle/schema";
// import { assertLocationAccess } from "@/lib/helpers/locationGuard";

// /**
//  * @param {{ location: "pastry" | "cafe", includeArchived?: boolean }} params
//  */
// export async function getProductCategories({ location, includeArchived = false }) {
//     await assertLocationAccess(location);

//     const conditions = [eq(ProductCategoriesTable.location, location)];
//     if (!includeArchived) {
//         conditions.push(isNull(ProductCategoriesTable.archivedAt));
//     }

//     const rows = await db
//         .select({
//             id: ProductCategoriesTable.id,
//             name: ProductCategoriesTable.name,
//             location: ProductCategoriesTable.location,
//             archivedAt: ProductCategoriesTable.archivedAt,
//         })
//         .from(ProductCategoriesTable)
//         .where(and(...conditions))
//         .orderBy(asc(ProductCategoriesTable.name));

//     return rows;
// }


"use server";

// actions/stock/categories/getProductCategories.js
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ProductCategoriesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { requireUser } from "@/lib/auth/session";
import { assertCanViewLocation, isAdmin, getUserLocation } from "@/lib/auth/rbac";
import { ForbiddenError } from "@/lib/utils/errors";

import { getCategoriesSchema } from "./_shared";

export const getProductCategories = withAction(async (input = {}) => {
    const user = await requireUser();
    const { location, includeArchived } = parseInput(getCategoriesSchema, input);

    // Если запросили конкретную локацию — проверяем доступ
    if (location) {
        assertCanViewLocation(user, location);
    } else {
        // Без location — только admin видит все; pastry/cafe — только свою
        if (!isAdmin(user)) {
            const own = getUserLocation(user);
            if (!own) throw new ForbiddenError("Нет доступа");
            // подставим как фильтр
            return await fetchRows({ location: own, includeArchived });
        }
    }

    return await fetchRows({ location, includeArchived });
}, { name: "getProductCategories" });

async function fetchRows({ location, includeArchived }) {
    const conditions = [];
    if (location) conditions.push(eq(ProductCategoriesTable.location, location));
    if (!includeArchived) conditions.push(isNull(ProductCategoriesTable.archivedAt));

    return await db
        .select()
        .from(ProductCategoriesTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(ProductCategoriesTable.name));
}