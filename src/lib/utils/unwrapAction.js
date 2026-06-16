// lib/utils/unwrapAction.js
// Server-only хелпер: разворачивает {ok, data, error} из server action.
// Используется в RSC и других server-контекстах.

/**
 * Развернуть результат action или бросить ошибку.
 * Используй в RSC, где ошибка должна всплыть в error.jsx.
 */
export async function unwrapAction(actionPromise) {
    const res = await actionPromise;
    if (!res?.ok) {
        const message =
            typeof res?.error === "string"
                ? res.error
                : res?.error?.message || "Ошибка операции";
        const err = new Error(message);
        err.code = res?.error?.code;
        err.fieldErrors = res?.error?.fieldErrors;
        throw err;
    }
    return res.data;
}

/**
 * Развернуть результат action, при ошибке — вернуть fallback.
 * Удобно когда страница должна отрисоваться даже при пустых данных.
 */
export async function unwrapActionOr(actionPromise, fallback) {
    const res = await actionPromise;
    if (!res?.ok) {
        console.error("[action error]", res?.error);
        return fallback;
    }
    return res.data;
}