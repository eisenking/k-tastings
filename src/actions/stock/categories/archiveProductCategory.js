// "use server";

// import { db } from "@/drizzle/db";
// import { eq, and } from "drizzle-orm";
// import { ProductCategoriesTable } from "@/drizzle/schema";
// import { assertLocationAccess } from "@/lib/helpers/locationGuard";

// /**
//  * @param {{ id: string, location: "pastry" | "cafe" }} params
//  */
// export async function archiveProductCategory({ id, location }) {
//     await assertLocationAccess(location);

//     const [updated] = await db
//         .update(ProductCategoriesTable)
//         .set({ archivedAt: new Date() })
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

// actions/stock/categories/archiveProductCategory.js
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ProductCategoriesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";
import { LOCATION_LABELS } from "@/lib/constants/labels";

import { archiveCategorySchema, getCategoryOrFail } from "./_shared";

/**
 * Тоггл архивации: если категория не в архиве — архивируем, иначе восстанавливаем.
 */
export const archiveProductCategory = withAction(async (input) => {
    const user = await requireUser();
    const { id } = parseInput(archiveCategorySchema, input);

    const result = await db.transaction(async (tx) => {
        const before = await getCategoryOrFail(tx, id);
        assertCanModifyLocation(user, before.location);

        const isCurrentlyArchived = before.archivedAt !== null;
        const nextArchivedAt = isCurrentlyArchived ? null : new Date();
        const action = isCurrentlyArchived ? "unarchive" : "archive";

        const [after] = await tx
            .update(ProductCategoriesTable)
            .set({ archivedAt: nextArchivedAt })
            .where(eq(ProductCategoriesTable.id, id))
            .returning();

        await logActivity({
            user,
            action,
            entity: "product_category",
            entityId: after.id,
            location: after.location,
            description: isCurrentlyArchived
                ? `Категория «${after.name}» восстановлена (${LOCATION_LABELS[after.location]})`
                : `Категория «${after.name}» отправлена в архив (${LOCATION_LABELS[after.location]})`,
            tx,
        });

        return after;
    });

    revalidatePath("/admin");
    revalidatePath(`/${result.location}`);

    return result;
}, { name: "archiveProductCategory" });