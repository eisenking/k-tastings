/** UI-лейблы ↔ enum категорий заготовок (pastry:preparation). */

export const PREP_CATEGORY_LABELS = {
    creams: "Крема",
    biscuits: "Бисквиты",
    soaks: "Промочки",
    other_pastry: "Прочее",
};

export const PREP_TAB_LABELS = Object.values(PREP_CATEGORY_LABELS);

const LABEL_TO_ENUM = Object.fromEntries(
    Object.entries(PREP_CATEGORY_LABELS).map(([k, v]) => [v, k]),
);

export function prepCategoryLabel(enumValue) {
    if (!enumValue) return "—";
    return PREP_CATEGORY_LABELS[enumValue] ?? enumValue;
}

export function prepCategoryFromLabel(label) {
    if (!label) return null;
    return LABEL_TO_ENUM[label] ?? null;
}

/** Краткий лейбл для таблицы (единственное число). */
export function prepCategoryShortLabel(enumValue) {
    const full = prepCategoryLabel(enumValue);
    if (full === "Крема") return "Крем";
    if (full === "Бисквиты") return "Бисквит";
    if (full === "Промочки") return "Промочка";
    return full;
}
