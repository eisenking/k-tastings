// lib/constants/labels.js
export const STOCK_MOVEMENT_LABELS = {
    receipt: "Приход",
    write_off: "Списание",
    transfer_out: "Перемещение — Выдача",
    transfer_in: "Перемещение — Приём",
    production: "Производство",
};

export const PREPARATION_CATEGORY_LABELS = {
    creams: "Крема",
    biscuits: "Бисквиты",
    soaks: "Промочки",
    other: "Прочее",
};

export const UNIT_LABELS = {
    g: "г", kg: "кг", ml: "мл", l: "л", pcs: "шт",
};

export const LOCATION_LABELS = {
    pastry: "Кондитерская",
    cafe: "Кафе",
};

// recipes
export const RECIPE_TYPE_LABELS = {
    preparation: "Заготовка",
    filling: "Начинка",
    dish: "Блюдо",
};

export const RECIPE_CATEGORY_LABELS = {
    // pastry preparations
    creams: "Кремы",
    biscuits: "Бисквиты",
    soaks: "Пропитки",
    other_pastry: "Прочее (кондитерская)",
    // cafe preparations
    sauces: "Соусы",
    marinades: "Маринады",
    cuts: "Нарезки",
    broths: "Бульоны",
    other_cafe: "Прочее (кафе)",
    // cafe dishes
    first_courses: "Первые блюда",
    main_courses: "Вторые блюда",
    sides: "Гарниры",
    desserts: "Десерты",
};

// Группировка категорий по (location, type) — для селектов в форме
export const RECIPE_CATEGORIES_BY_CONTEXT = {
    "pastry:preparation": ["creams", "biscuits", "soaks", "other_pastry"],
    "cafe:preparation": ["sauces", "marinades", "cuts", "broths", "other_cafe"],
    "cafe:dish": ["first_courses", "main_courses", "sides", "desserts"],
    // filling — без категории
};