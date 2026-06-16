import { db } from "@/drizzle/db";
import { ActivityLogTable } from "@/drizzle/schema";
import { headers } from "next/headers";

/**
 * Запись в журнал активности.
 *
 * @param {object} params
 * @param {{ id: string, name: string, role?: string|null }} [params.user]
 * @param {string} params.action       — из ACTIVITY_ACTIONS
 * @param {string} params.entity       — из ACTIVITY_ENTITIES
 * @param {string} [params.entityId]   — UUID
 * @param {string} [params.entityKey]  — для нечисловых ID (например, user.id text)
 * @param {"pastry"|"cafe"} [params.location]
 * @param {string} params.description
 * @param {object} [params.metadata]
 * @param {import("drizzle-orm").PgTransaction} [params.tx]
 */
export async function logActivity({
    user,
    action,
    entity,
    entityId,
    entityKey,
    location,
    description,
    metadata,
    tx,
}) {
    const executor = tx ?? db;

    let ipAddress = null;
    let userAgent = null;
    try {
        const h = await headers();
        ipAddress =
            h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            h.get("x-real-ip") ??
            null;
        userAgent = h.get("user-agent") ?? null;
    } catch {
        // вне HTTP-контекста (cron / seed) — игнорим
    }

    try {
        await executor.insert(ActivityLogTable).values({
            userId: user?.id ?? null,
            userName: user?.name ?? "system",
            userRole: user?.role ?? null,
            action,
            entity,
            entityId: entityId ?? null,
            entityKey: entityKey ?? null,
            location: location ?? null,
            description,
            metadata: metadata ?? null,
            ipAddress,
            userAgent,
        });
    } catch (err) {
        // ⚠ Если мы внутри tx — ошибка лога откатит транзакцию. Это правильно.
        // Если вне tx — просто логируем и не падаем.
        console.error("[logActivity] failed", { action, entity, err });
        if (tx) throw err;
    }
}