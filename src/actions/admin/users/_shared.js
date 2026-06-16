import "server-only";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { USER_ROLES } from "@/lib/constants/roles";

/** Роли, которые admin может назначить пользователю. */
export const ALLOWED_ROLES = USER_ROLES;

/**
 * Нормализует значение роли из формы / селекта.
 * "none" / "" / undefined → null
 */
export function normalizeRole(value) {
    if (value === "none" || value === "" || value == null) return null;
    return value;
}

/**
 * Возвращает true, если значение — валидная роль или null.
 */
export function isValidRole(value) {
    return value === null || ALLOWED_ROLES.includes(value);
}

/**
 * Гард для админских экшенов. Возвращает session или кидает.
 */
export async function getAdminSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        const err = new Error("Unauthorized");
        err.code = "UNAUTHORIZED";
        throw err;
    }
    if (session.user.role !== "admin") {
        const err = new Error("Forbidden: admin only");
        err.code = "FORBIDDEN";
        throw err;
    }
    return session;
}