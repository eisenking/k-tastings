import { ROLES, USER_ROLES } from "@/lib/constants/roles";

/** Роли пользователя — из единого источника `roles.js`. */
export type UserRole = (typeof USER_ROLES)[number];

export type NavLink = {
    href: string;
    label: string;
    /** Если не указано — ссылка видна всем авторизованным (не используем без причины). */
    roles?: UserRole[];
};

/**
 * Видимость ссылок в Navbar (UI-фильтр; реальные права — в server actions / rbac.js).
 *
 * | Маршрут   | Роли                |
 * |-----------|---------------------|
 * | /admin    | admin               |
 * | /website  | admin, office       |
 * | /office   | admin, office       |
 * | /pastry   | admin, pastry       |
 * | /cafe     | admin, cafe         |
 */
export const NAV_LINKS: NavLink[] = [
    { href: "/admin", label: "Админ", roles: [ROLES.ADMIN] },
    { href: "/website", label: "Сайт", roles: [ROLES.ADMIN, ROLES.OFFICE] },
    { href: "/office", label: "Офис", roles: [ROLES.ADMIN, ROLES.OFFICE] },
    { href: "/pastry", label: "Торты", roles: [ROLES.ADMIN, ROLES.PASTRY] },
    { href: "/cafe", label: "Кафе", roles: [ROLES.ADMIN, ROLES.CAFE] },
];

export function filterLinksByRole(links: NavLink[], role?: string): NavLink[] {
    return links.filter((link) => {
        if (!link.roles) return true;
        if (!role) return false;
        return link.roles.includes(role as UserRole);
    });
}
