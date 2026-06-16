// lib/constants/units.js

// ─── То, что хранится в БД (enum'ы) ──────────────────────────────────────────
// Должно совпадать с drizzle/schemas/stock/_enums.js
export const PRODUCT_MEASURES = ["mass", "volume", "piece"];
export const BASE_UNITS = ["g", "ml"];

// ─── Единицы ввода в UI (что юзер выбирает в форме «Приход») ────────────────
export const INPUT_UNITS = ["g", "kg", "ml", "l", "pcs"];

// ─── Человеко-читаемые лейблы ───────────────────────────────────────────────
export const MEASURE_LABELS = {
    mass: "Масса",
    volume: "Объём",
    piece: "Штучный",
};

export const UNIT_LABELS = {
    g: "г",
    kg: "кг",
    ml: "мл",
    l: "л",
    pcs: "шт",
};

// Обратный словарь — если когда-то понадобится распарсить "г" → "g" (например, из старых данных)
export const UNIT_FROM_LABEL = Object.fromEntries(
    Object.entries(UNIT_LABELS).map(([k, v]) => [v, k]),
);

// ─── Связь единицы ввода с мерой продукта ───────────────────────────────────
// Какая мера у продукта, если он принимается в данной единице.
// Для "pcs" мера неоднозначна (может быть piece-mass или piece-volume),
// поэтому возвращаем null — клиент должен указать явно.
export const UNIT_TO_MEASURE = {
    g: "mass",
    kg: "mass",
    ml: "volume",
    l: "volume",
    pcs: null,
};

// ─── Коэффициенты к базовой единице ─────────────────────────────────────────
// Для крупных единиц (кг, л) — фиксированный коэффициент.
// Для "pcs" нужен product.pieceToBase (1 шт = X г/мл) — задаётся на продукте.
export const UNIT_TO_BASE_FACTOR = {
    g: 1,
    kg: 1000,
    ml: 1,
    l: 1000,
    // pcs обрабатывается отдельно через pieceToBase
};

// ─── Базовая единица по мере ────────────────────────────────────────────────
export const MEASURE_TO_BASE_UNIT = {
    mass: "g",
    volume: "ml",
    // piece — определяется по pieceToBase
};