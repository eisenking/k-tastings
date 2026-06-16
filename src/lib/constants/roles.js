/** Все роли в системе (массив — для drizzle/zod enum'ов). */
export const USER_ROLES = ["admin", "cafe", "pastry", "office"];

/** Именованные роли — используем в коде вместо магических строк. */
export const ROLES = Object.freeze({
    ADMIN: "admin",
    OFFICE: "office",
    PASTRY: "pastry",
    CAFE: "cafe",
});

/** Все локации (массив для совместимости с drizzle enum). */
export const LOCATIONS_LIST = ["pastry", "cafe"];

/** Именованные локации. */
export const LOCATIONS = Object.freeze({
    PASTRY: "pastry",
    CAFE: "cafe",
});

/** Роли, которые привязаны к локации (видят только свою). */
export const LOCATION_ROLES = Object.freeze([ROLES.PASTRY, ROLES.CAFE]);

/** Маппинг: роль → "своя" локация. Для admin/office возвращает undefined. */
export const ROLE_TO_LOCATION = Object.freeze({
    [ROLES.PASTRY]: LOCATIONS.PASTRY,
    [ROLES.CAFE]: LOCATIONS.CAFE,
});