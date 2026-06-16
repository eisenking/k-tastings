import { ROLES, LOCATIONS, ROLE_TO_LOCATION } from "@/lib/constants/roles";
import { ForbiddenError } from "@/lib/utils/errors";

// Реэкспорт — чтоб не нужно было два импорта в actions
export { ROLES, LOCATIONS };

// ─────────────────────────────────────────────────────────────────────────────
// Базовые предикаты
// ─────────────────────────────────────────────────────────────────────────────

export const isAdmin = (u) => u?.role === ROLES.ADMIN;
export const isOffice = (u) => u?.role === ROLES.OFFICE;
export const isPastry = (u) => u?.role === ROLES.PASTRY;
export const isCafe = (u) => u?.role === ROLES.CAFE;
export const isLocationRole = (u) => isPastry(u) || isCafe(u);

/**
 * Локация, к которой "привязан" юзер (для pastry/cafe).
 * Для admin/office → null.
 */
export const getUserLocation = (u) => ROLE_TO_LOCATION[u?.role] ?? null;

// ─────────────────────────────────────────────────────────────────────────────
// Доменные правила
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Складские локации (pastry/cafe): admin — все, pastry/cafe — своя.
 * Office к складским локациям не имеет доступа (только /office и /website).
 */
export function canViewLocation(user, location) {
    if (!user) return false;
    if (location === "all") return isAdmin(user);
    if (isAdmin(user)) return true;
    if (isOffice(user)) return false;
    return getUserLocation(user) === location;
}

/** Изменять данные локации (продукты, рецепты, производство, приходы). */
export function canModifyLocation(user, location) {
    if (!user) return false;
    if (isAdmin(user)) return true;
    if (isOffice(user)) return false;
    return getUserLocation(user) === location;
}

/** Перемещения между локациями — только admin. */
export const canTransfer = (u) => isAdmin(u);

/** Управление пользователями — только admin. */
export const canManageUsers = (u) => isAdmin(u);

/** Журнал активности — только admin. */
export const canViewActivity = (u) => isAdmin(u);

/** Финансы — admin + office (раздел /office). */
export const canViewFinance = (u) => isAdmin(u) || isOffice(u);

/** Контент сайта — admin + office (раздел /website). */
export const canManageWebsite = (u) => isAdmin(u) || isOffice(u);

/** Заказы — admin + office (раздел /office). */
export const canManageOrders = (u) => isAdmin(u) || isOffice(u);

// ─────────────────────────────────────────────────────────────────────────────
// Assert-хелперы (бросают ForbiddenError → ловится withAction)
// ─────────────────────────────────────────────────────────────────────────────

export function assertAdmin(user) {
    if (!isAdmin(user)) throw new ForbiddenError("Доступ только для администратора");
}

export function assertCanViewLocation(user, location) {
    if (!canViewLocation(user, location)) {
        throw new ForbiddenError("Нет доступа к данным этой локации");
    }
}

export function assertCanModifyLocation(user, location) {
    if (!canModifyLocation(user, location)) {
        throw new ForbiddenError("Нет прав на изменения в этой локации");
    }
}

export function assertCanTransfer(user) {
    if (!canTransfer(user)) {
        throw new ForbiddenError("Перемещения доступны только администратору");
    }
}

export function assertCanManageUsers(user) {
    if (!canManageUsers(user)) {
        throw new ForbiddenError("Управление пользователями — только для администратора");
    }
}

export function assertCanViewActivity(user) {
    if (!canViewActivity(user)) {
        throw new ForbiddenError("Журнал доступен только администратору");
    }
}

export function assertCanViewFinance(user) {
    if (!canViewFinance(user)) {
        throw new ForbiddenError("Финансы доступны только администратору и офису");
    }
}

export function assertCanManageWebsite(user) {
    if (!canManageWebsite(user)) {
        throw new ForbiddenError("Управление сайтом — только администратор и офис");
    }
}

export function assertCanManageOrders(user) {
    if (!canManageOrders(user)) {
        throw new ForbiddenError("Заказы — только администратор и офис");
    }
}
