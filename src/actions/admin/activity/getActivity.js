// "use server";

// import { db } from "@/drizzle/db";
// import { ActivityLogTable } from "@/drizzle/schema";
// import { and, desc, eq, gte, lte, ilike, count } from "drizzle-orm";
// import { requireAdmin } from "@/lib/auth/session";

// /**
//  * Получение записей activity_log с фильтрами и пагинацией.
//  *
//  * @param {object} params
//  * @param {number} [params.page=1]
//  * @param {number} [params.pageSize=50]
//  * @param {string} [params.userId]
//  * @param {string} [params.action]
//  * @param {string} [params.entity]
//  * @param {string} [params.location]
//  * @param {string} [params.search]   — подстрока в description
//  * @param {string} [params.from]     — ISO дата
//  * @param {string} [params.to]       — ISO дата
//  */
// export async function getActivity(params = {}) {
//     try {
//         await requireAdmin();
//     } catch (err) {
//         return { ok: false, error: "Нет доступа" };
//     }

//     const page = Math.max(1, Number(params.page) || 1);
//     const pageSize = Math.min(200, Math.max(10, Number(params.pageSize) || 50));
//     const offset = (page - 1) * pageSize;

//     const conditions = [];
//     if (params.userId) conditions.push(eq(ActivityLogTable.userId, params.userId));
//     if (params.action) conditions.push(eq(ActivityLogTable.action, params.action));
//     if (params.entity) conditions.push(eq(ActivityLogTable.entity, params.entity));
//     if (params.location) conditions.push(eq(ActivityLogTable.location, params.location));
//     if (params.search) conditions.push(ilike(ActivityLogTable.description, `%${params.search}%`));
//     if (params.from) conditions.push(gte(ActivityLogTable.createdAt, new Date(params.from)));
//     if (params.to) conditions.push(lte(ActivityLogTable.createdAt, new Date(params.to)));

//     const where = conditions.length ? and(...conditions) : undefined;

//     try {
//         const [rows, totalRow] = await Promise.all([
//             db.query.ActivityLogTable.findMany({
//                 where,
//                 orderBy: (a, { desc }) => desc(a.createdAt),
//                 limit: pageSize,
//                 offset,
//                 with: {
//                     user: {
//                         columns: { id: true, name: true, email: true, role: true },
//                     },
//                 },
//             }),
//             db
//                 .select({ value: count() })
//                 .from(ActivityLogTable)
//                 .where(where)
//                 .then((r) => r[0]),
//         ]);

//         return {
//             ok: true,
//             data: {
//                 rows,
//                 total: Number(totalRow?.value ?? 0),
//                 page,
//                 pageSize,
//                 pageCount: Math.ceil(Number(totalRow?.value ?? 0) / pageSize),
//             },
//         };
//     } catch (err) {
//         console.error("[getActivity]", err);
//         return { ok: false, error: "Ошибка загрузки журнала" };
//     }
// }

"use server";

// actions/admin/activity/getActivity.js
import { z } from "zod";
import { and, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { ActivityLogTable } from "@/drizzle/schema";

import { withAction } from "@/lib/utils/action-response";
import { parseInput } from "@/lib/utils/validation";
import { requireUser } from "@/lib/auth/session";
import { assertCanViewActivity } from "@/lib/auth/rbac";
import { LOCATIONS_LIST } from "@/lib/constants/roles";
import { ACTIVITY_ACTIONS, ACTIVITY_ENTITIES } from "@/drizzle/schema";

// "" / "   " → undefined, иначе trimmed string
const emptyStr = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined || v === null) return undefined;
        const t = v.trim();
        return t === "" ? undefined : t;
    });

// дата из строки (ISO) или undefined; пустая строка → undefined
const optionalDate = z
    .string()
    .optional()
    .transform((v, ctx) => {
        if (!v || v.trim() === "") return undefined;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Некорректная дата",
            });
            return z.NEVER;
        }
        return d;
    });

const getActivitySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().min(10).max(200).optional().default(50),

    userId: emptyStr,
    search: emptyStr,

    // enum'ы валидируем ПОСЛЕ нормализации (через pipe)
    action: emptyStr.pipe(z.enum(ACTIVITY_ACTIONS).optional()),
    entity: emptyStr.pipe(z.enum(ACTIVITY_ENTITIES).optional()),
    location: emptyStr.pipe(z.enum(LOCATIONS_LIST).optional()),

    from: optionalDate,
    to: optionalDate,
});

export const getActivity = withAction(async (params = {}) => {
    const user = await requireUser();
    assertCanViewActivity(user);

    const {
        page,
        pageSize,
        userId,
        action,
        entity,
        location,
        search,
        from,
        to,
    } = parseInput(getActivitySchema, params);

    const conditions = [];
    if (userId) conditions.push(eq(ActivityLogTable.userId, userId));
    if (action) conditions.push(eq(ActivityLogTable.action, action));
    if (entity) conditions.push(eq(ActivityLogTable.entity, entity));
    if (location) conditions.push(eq(ActivityLogTable.location, location));
    if (search) conditions.push(ilike(ActivityLogTable.description, `%${search}%`));
    if (from) conditions.push(gte(ActivityLogTable.createdAt, from));
    if (to) conditions.push(lte(ActivityLogTable.createdAt, to));

    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [rows, totalRow] = await Promise.all([
        db.query.ActivityLogTable.findMany({
            where,
            orderBy: (a) => desc(a.createdAt),
            limit: pageSize,
            offset,
            with: {
                user: {
                    columns: { id: true, name: true, email: true, role: true },
                },
            },
        }),
        db
            .select({ value: count() })
            .from(ActivityLogTable)
            .where(where)
            .then((r) => r[0]),
    ]);

    const total = Number(totalRow?.value ?? 0);

    return {
        rows,
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
    };
}, { name: "getActivity" });