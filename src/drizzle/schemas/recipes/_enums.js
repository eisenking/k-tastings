


import { pgEnum } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// Типы рецептов
// ─────────────────────────────────────────────────────────────────────────────
// preparation — заготовка (для обеих локаций: кремы/бисквиты/соусы/нарезки)
// filling     — начинка (только pastry, итоговая сборка кондитерского изделия)
// dish        — блюдо (только cafe, готовая позиция меню)
export const RECIPE_TYPES = ["preparation", "filling", "dish"];
export const recipeTypeEnum = pgEnum("recipe_type", RECIPE_TYPES);

// ─────────────────────────────────────────────────────────────────────────────
// Категории рецептов (одно поле на preparation + dish)
// ─────────────────────────────────────────────────────────────────────────────
// filling — без категории (NULL)
// preparation (pastry): creams, biscuits, soaks, other_pastry
// preparation (cafe):   sauces, marinades, cuts, broths, other_cafe
// dish (cafe):          first_courses, main_courses, sides, desserts
export const RECIPE_CATEGORIES = [
    // pastry preparations
    "creams",
    "biscuits",
    "soaks",
    "other_pastry",
    // cafe preparations
    "sauces",
    "marinades",
    "cuts",
    "broths",
    "other_cafe",
    // cafe dishes
    "first_courses",
    "main_courses",
    "sides",
    "desserts",
];
export const recipeCategoryEnum = pgEnum("recipe_category", RECIPE_CATEGORIES);

// ─────────────────────────────────────────────────────────────────────────────
// Полиморфные ссылки и источники
// ─────────────────────────────────────────────────────────────────────────────
export const RECIPE_ITEM_REF_TYPES = ["product", "recipe"];
export const recipeItemRefTypeEnum = pgEnum("recipe_item_ref_type", RECIPE_ITEM_REF_TYPES);

export const CONSUMPTION_SOURCE_TYPES = ["product_batch", "production_batch"];
export const consumptionSourceTypeEnum = pgEnum("consumption_source_type", CONSUMPTION_SOURCE_TYPES);

// ─────────────────────────────────────────────────────────────────────────────
// Допустимые категории по контексту "location:type"
// ─────────────────────────────────────────────────────────────────────────────
// Используется и в server actions (валидация), и в UI (выпадашки).
// Ключ — `${location}:${type}`. Для filling список пустой (категории нет).
export const RECIPE_CATEGORIES_BY_CONTEXT = {
    "pastry:preparation": ["creams", "biscuits", "soaks", "other_pastry"],
    "pastry:filling": [],
    "cafe:preparation": ["sauces", "marinades", "cuts", "broths", "other_cafe"],
    "cafe:dish": ["first_courses", "main_courses", "sides", "desserts"],
};