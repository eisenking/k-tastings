/**
 * @deprecated Use `requireUser()` from `@/lib/auth/session`
 *             + `assertCan*()` from `@/lib/auth/rbac` instead.
 *             Will be removed after migration of all actions.
 */




import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

/**
 * Проверяет, что у пользователя есть доступ к указанной локации.
 * Бросает Error если нет.
 * Возвращает { session, userId, userName, role } если есть.
 */
export async function assertLocationAccess(location) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const role = session.user.role; // 'admin' | 'pastry' | 'cafe'

    if (role !== "admin" && role !== location) {
        throw new Error("Forbidden: нет доступа к этой локации");
    }

    if (!["pastry", "cafe"].includes(location)) {
        throw new Error("Некорректная локация");
    }

    return {
        session,
        userId: session.user.id,
        userName: session.user.name ?? "system",
        role,
    };
}

/**
 * Для админских view, где нужны все локации.
 */
export async function assertAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "admin") throw new Error("Forbidden: admin only");

    return {
        session,
        userId: session.user.id,
        userName: session.user.name ?? "system",
    };
}