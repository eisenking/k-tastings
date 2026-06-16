import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/auth-server";

/**
 * Требует залогиненного пользователя. Редирект на / если нет сессии.
 * @returns {Promise<NonNullable<Awaited<ReturnType<typeof getServerSession>>["user"]>>}
 */
export async function requireSession() {
    const session = await getServerSession();
    const user = session?.user;

    if (!user) redirect("/");
    if (user.banned) redirect("/");

    return user;
}

/**
 * Требует одну из указанных ролей. Иначе редирект на /.
 * @param {string[]} allowedRoles
 */
export async function requireRoles(allowedRoles) {
    const user = await requireSession();
    const role = user.role ?? null;

    if (!role || !allowedRoles.includes(role)) {
        redirect("/");
    }

    return user;
}
