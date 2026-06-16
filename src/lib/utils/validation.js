// import { ValidationError } from "./errors";

// /**
//  * Валидирует input через zod-схему.
//  * Бросает ValidationError с понятным сообщением — её ловит withAction().
//  *
//  * @example
//  *   const data = parseInput(schema, input);
//  */
// export function parseInput(schema, input) {
//     const result = schema.safeParse(input);
//     if (!result.success) {
//         const fieldErrors = {};
//         for (const issue of result.error.issues) {
//             const key = issue.path.join(".") || "_root";
//             if (!fieldErrors[key]) fieldErrors[key] = issue.message;
//         }
//         const firstMsg =
//             result.error.issues[0]?.message ?? "Некорректные данные";
//         throw new ValidationError(firstMsg, fieldErrors);
//     }
//     return result.data;
// }

// lib/utils/validation.js
import { ValidationError } from "./errors";

/**
 * Прогоняет input через zod-схему. При ошибке кидает ValidationError.
 */
export function parseInput(schema, input) {
    const result = schema.safeParse(input);
    if (!result.success) {
        const fieldErrors = {};
        for (const issue of result.error.issues) {
            const key = issue.path.join(".") || "_root";
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        const firstMsg = result.error.issues[0]?.message ?? "Некорректные данные";
        throw new ValidationError(firstMsg, fieldErrors);
    }
    return result.data;
}