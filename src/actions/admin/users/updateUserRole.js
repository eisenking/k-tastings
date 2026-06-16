"use server";

import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schemas/auth/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    getAdminSession,
    normalizeRole,
    isValidRole,
} from "./_shared";

/**
 * @param {string} userId
 * @param {string} newRole - "admin" | "office" | "pastry" | "cafe" | "none"
 */
export async function updateUserRole(userId, newRole) {
    let session;
    try {
        session = await getAdminSession();
    } catch (e) {
        return { success: false, error: e.message };
    }

    if (session.user.id === userId) {
        return { success: false, error: "Нельзя менять собственную роль" };
    }

    const role = normalizeRole(newRole);
    if (!isValidRole(role)) {
        return { success: false, error: "Недопустимая роль" };
    }

    try {
        await db
            .update(user)
            .set({ role, updatedAt: new Date() })
            .where(eq(user.id, userId));

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("updateUserRole error", error);
        return { success: false, error: "Ошибка обновления роли" };
    }
}