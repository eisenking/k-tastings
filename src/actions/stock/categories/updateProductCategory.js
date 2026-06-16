// "use server";

// import { db } from "@/drizzle/db";
// import { eq, and } from "drizzle-orm";
// import { ProductCategoriesTable } from "@/drizzle/schema";
// import { assertLocationAccess } from "@/lib/helpers/locationGuard";

// /**
//  * @param {{ id: string, location: "pastry" | "cafe", name: string }} params
//  */
// export async function updateProductCategory({ id, location, name }) {
//     await assertLocationAccess(location);

//     const trimmed = String(name ?? "").trim();
//     if (!trimmed) throw new Error("Название категории обязательно");

//     const [updated] = await db
//         .update(ProductCategoriesTable)
//         .set({ name: trimmed, updatedAt: new Date() })
//         .where(
//             and(
//                 eq(ProductCategoriesTable.id, id),
//                 eq(ProductCategoriesTable.location, location)
//             )
//         )
//         .returning();

//     if (!updated) throw new Error("Категория не найдена");
//     return updated;
// }


"use server";

// actions/stock/categories/updateProductCategory.js
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ProductCategoriesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { ConflictError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";
import { LOCATION_LABELS } from "@/lib/constants/labels";

import {
    updateCategorySchema,
    getCategoryOrFail,
    isNameTaken,
} from "./_shared";

export const updateProductCategory = withAction(async (input) => {
    const user = await requireUser();
    const data = parseInput(updateCategorySchema, input);

    const updated = await db.transaction(async (tx) => {
        // Достаём текущую запись (для прав, before-snapshot и проверки уникальности)
        const before = await getCategoryOrFail(tx, data.id);

        // Проверка прав: модифицировать можно только свою локацию
        assertCanModifyLocation(user, before.location);

        // Если имя не изменилось — ничего не делаем (без лога)
        if (before.name === data.name) {
            return before;
        }

        // Уникальность нового имени в той же локации
        if (
            await isNameTaken(tx, {
                name: data.name,
                location: before.location,
                excludeId: before.id,
            })
        ) {
            throw new ConflictError(
                `Категория «${data.name}» уже есть в локации ${LOCATION_LABELS[before.location]}`,
            );
        }

        const [after] = await tx
            .update(ProductCategoriesTable)
            .set({ name: data.name })
            .where(eq(ProductCategoriesTable.id, data.id))
            .returning();

        await logActivity({
            user,
            action: "update",
            entity: "product_category",
            entityId: after.id,
            location: after.location,
            description: `Категория переименована: «${before.name}» → «${after.name}»`,
            metadata: {
                before: { name: before.name },
                after: { name: after.name },
            },
            tx,
        });

        return after;
    });

    revalidatePath("/admin");
    revalidatePath(`/${updated.location}`);

    return updated;
}, { name: "updateProductCategory" });