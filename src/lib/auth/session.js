// import { auth } from "@/lib/auth"; // твой BetterAuth instance
// import { headers } from "next/headers";
// import { UnauthorizedError, ForbiddenError } from "../utils/errors";

// /**
//  * Возвращает текущего пользователя или null.
//  */
// export async function getCurrentUser() {
//     const session = await auth.api.getSession({
//         headers: await headers(),
//     });

//     if (!session?.user) return null;

//     return {
//         id: session.user.id,
//         name: session.user.name,
//         email: session.user.email,
//         role: session.user.role ?? null,
//         banned: session.user.banned ?? false,
//     };
// }

// /**
//  * Возвращает текущего пользователя или бросает UnauthorizedError.
//  * Использовать в начале каждого защищённого action.
//  */
// export async function requireUser() {
//     const user = await getCurrentUser();
//     if (!user) throw new UnauthorizedError();
//     if (user.banned) throw new ForbiddenError("Аккаунт заблокирован");
//     return user;
// }


// lib/auth/session.js
import { getServerSession } from "@/lib/auth/auth-server";
import { UnauthorizedError, ForbiddenError } from "@/lib/utils/errors";

/**
 * Текущий пользователь из сессии или null.
 * Возвращает нормализованный объект (BetterAuth даёт чуть больше полей).
 */
export async function getCurrentUser() {
    const session = await getServerSession();
    if (!session?.user) return null;

    return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role ?? null,
        banned: session.user.banned ?? false,
    };
}

/**
 * Требует залогиненного юзера. Кидает UnauthorizedError/ForbiddenError.
 */
export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();
    if (user.banned) throw new ForbiddenError("Аккаунт заблокирован");
    return user;
}