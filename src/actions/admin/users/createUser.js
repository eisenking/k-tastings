"use server";

import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schemas/auth/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import {
    getAdminSession,
    normalizeRole,
    isValidRole,
} from "./_shared";

/**
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   username?: string,
 *   role?: "admin" | "office" | "pastry" | "cafe" | "none" | null,
 * }} input
 */
export async function createUser(input) {
    try {
        await getAdminSession();
    } catch (e) {
        return { success: false, error: e.message };
    }

    const name = String(input?.name ?? "").trim();
    const email = String(input?.email ?? "").trim().toLowerCase();
    const password = String(input?.password ?? "");
    const username = input?.username
        ? String(input.username).trim()
        : null;
    const role = normalizeRole(input?.role);

    if (!name) return { success: false, error: "Имя обязательно" };
    if (!email) return { success: false, error: "Email обязателен" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: "Некорректный email" };
    }
    if (password.length < 8) {
        return {
            success: false,
            error: "Пароль должен быть не короче 8 символов",
        };
    }
    if (!isValidRole(role)) {
        return { success: false, error: "Недопустимая роль" };
    }

    try {
        // 1) создаём пользователя средствами better-auth
        // signUpEmail сам хэширует пароль и создаёт запись в user + account
        const res = await auth.api.signUpEmail({
            body: {
                name,
                email,
                password,
                ...(username ? { username } : {}),
            },
        });

        const newUserId = res?.user?.id;
        if (!newUserId) {
            return { success: false, error: "Не удалось создать пользователя" };
        }

        // 2) ставим роль (если задана)
        if (role) {
            await db
                .update(user)
                .set({ role, updatedAt: new Date() })
                .where(eq(user.id, newUserId));
        }

        revalidatePath("/admin");
        return { success: true, userId: newUserId };
    } catch (error) {
        console.error("createUser error", error);

        const msg = error?.message ?? "";
        if (
            msg.toLowerCase().includes("unique") ||
            msg.toLowerCase().includes("exists")
        ) {
            return {
                success: false,
                error: "Пользователь с таким email или username уже существует",
            };
        }

        return { success: false, error: "Ошибка создания пользователя" };
    }
}