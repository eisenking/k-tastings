// import { ActionError } from "./errors";

// /**
//  * Успешный ответ.
//  */
// export function ok(data) {
//     return { ok: true, data };
// }

// /**
//  * Ответ с ошибкой.
//  */
// export function fail(error, meta) {
//     return { ok: false, error, ...(meta ? { meta } : {}) };
// }

// /**
//  * Обёртка для server actions.
//  * - Ловит исключения.
//  * - ActionError → возвращает клиенту message.
//  * - Любая другая ошибка → логирует и возвращает обобщённую ошибку.
//  *
//  * Использование:
//  *   export const myAction = withAction(async (input) => {
//  *       // ... бизнес-логика
//  *       return result; // вернётся как { ok: true, data: result }
//  *   }, { name: "myAction" });
//  */

// export function withAction(handler, { name = "action" } = {}) {
//     return async (...args) => {
//         try {
//             const result = await handler(...args);
//             // Если хендлер сам вернул { ok, data/error } — не оборачиваем повторно
//             if (
//                 result &&
//                 typeof result === "object" &&
//                 "ok" in result &&
//                 typeof result.ok === "boolean"
//             ) {
//                 return result;
//             }
//             return ok(result);
//         } catch (err) {
//             if (err instanceof ActionError) {
//                 return fail(err.message, err.meta);
//             }
//             // Логируем неожиданные ошибки
//             console.error(`[${name}]`, err);
//             return fail("Внутренняя ошибка сервера");
//         }
//     };
// }


// lib/utils/action-response.js
import { ActionError } from "./errors";

export function ok(data) {
    return { ok: true, data };
}

export function fail(error, meta) {
    return { ok: false, error, ...(meta ? { meta } : {}) };
}

/**
 * Оборачивает server action: try/catch + единый формат ответа.
 *
 * @param {Function} handler  async (input) => result | { ok, ... }
 * @param {object} [opts]
 * @param {string} [opts.name] — имя для логов
 */
export function withAction(handler, { name = "action" } = {}) {
    return async (...args) => {
        try {
            const result = await handler(...args);
            if (
                result &&
                typeof result === "object" &&
                "ok" in result &&
                typeof result.ok === "boolean"
            ) {
                return result;
            }
            return ok(result);
        } catch (err) {
            if (err instanceof ActionError) {
                return fail(err.message, err.meta);
            }
            console.error(`[${name}]`, err);
            return fail("Внутренняя ошибка сервера");
        }
    };
}