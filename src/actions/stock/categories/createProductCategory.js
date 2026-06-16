// "use server";

// import { db } from "@/drizzle/db";
// import { ProductCategoriesTable } from "@/drizzle/schema";
// import { assertLocationAccess } from "@/lib/helpers/locationGuard";

// /**
//  * @param {{ location: "pastry" | "cafe", name: string }} params
//  */
// export async function createProductCategory({ location, name }) {
//     const { userId, userName } = await assertLocationAccess(location);

//     const trimmed = String(name ?? "").trim();
//     if (!trimmed) throw new Error("Название категории обязательно");

//     const [created] = await db
//         .insert(ProductCategoriesTable)
//         .values({
//             name: trimmed,
//             location,
//             userId,
//             userName,
//         })
//         .returning();

//     return created;
// }


"use server";

// actions/stock/categories/createProductCategory.js
import { revalidatePath } from "next/cache";
import { db } from "@/drizzle/db";
import { ProductCategoriesTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { ConflictError } from "@/lib/utils/errors";
import { requireUser } from "@/lib/auth/session";
import { assertCanModifyLocation } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/audit/log";
import { LOCATION_LABELS } from "@/lib/constants/labels";

import { createCategorySchema, isNameTaken } from "./_shared";

export const createProductCategory = withAction(async (input) => {
    // 1. Auth
    const user = await requireUser();

    // 2. Validation
    const data = parseInput(createCategorySchema, input);

    // 3. RBAC
    assertCanModifyLocation(user, data.location);

    // 4. Business logic + audit в одной транзакции
    const created = await db.transaction(async (tx) => {
        // 4.1 Проверка уникальности (даём понятную ошибку до DB-constraint)
        if (await isNameTaken(tx, { name: data.name, location: data.location })) {
            throw new ConflictError(
                `Категория «${data.name}» уже есть в локации ${LOCATION_LABELS[data.location]}`,
            );
        }

        // 4.2 Создание
        const [row] = await tx
            .insert(ProductCategoriesTable)
            .values({
                name: data.name,
                location: data.location,
                userId: user.id,
            })
            .returning();

        // 4.3 Audit
        await logActivity({
            user,
            action: "create",
            entity: "product_category",
            entityId: row.id,
            location: row.location,
            description: `Создана категория «${row.name}» в локации ${LOCATION_LABELS[row.location]}`,
            metadata: { name: row.name, location: row.location },
            tx,
        });

        return row;
    });

    // 5. Revalidate
    revalidatePath("/admin");
    revalidatePath(`/${created.location}`);

    return created;
}, { name: "createProductCategory" });