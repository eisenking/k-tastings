// export const ACTION_LABELS = {
//     create: "Создание",
//     update: "Изменение",
//     delete: "Удаление",
//     archive: "Архивация",
//     unarchive: "Восстановление",

//     stock_receipt: "Приход",
//     stock_write_off: "Списание",
//     stock_transfer: "Перемещение",
//     stock_adjustment: "Корректировка",

//     production_create: "Производство",
//     production_void: "Отмена производства",

//     user_login: "Вход",
//     user_logout: "Выход",
//     user_register: "Регистрация",
//     user_role_change: "Смена роли",

//     order_create: "Создание заказа",
//     order_status_change: "Смена статуса заказа",
//     order_cancel: "Отмена заказа",
// };

// export const ENTITY_LABELS = {
//     product: "Продукт",
//     product_category: "Категория продуктов",
//     product_batch: "Партия",
//     stock_movement: "Движение склада",
//     stock_transfer: "Перемещение",
//     recipe: "Рецепт",
//     recipe_item: "Ингредиент рецепта",
//     production_batch: "Производственная партия",
//     website_product: "Товар сайта",
//     website_category: "Категория сайта",
//     order: "Заказ",
//     user: "Пользователь",
// };

// export const LOCATION_LABELS = {
//     pastry: "Кондитерская",
//     cafe: "Кафе",
// };

// export const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
// export const ENTITY_OPTIONS = Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }));
// export const LOCATION_OPTIONS = Object.entries(LOCATION_LABELS).map(([value, label]) => ({ value, label }));

// export const ACTION_BADGE_VARIANT = {
//     create: "default",
//     update: "secondary",
//     delete: "destructive",
//     archive: "outline",
//     unarchive: "outline",

//     stock_receipt: "default",
//     stock_write_off: "destructive",
//     stock_transfer: "secondary",
//     stock_adjustment: "outline",

//     production_create: "default",
//     production_void: "destructive",

//     user_login: "outline",
//     user_logout: "outline",
//     user_register: "default",
//     user_role_change: "secondary",

//     order_create: "default",
//     order_status_change: "secondary",
//     order_cancel: "destructive",
// };

// export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];


// app/(dashboard)/admin/_components/ActivityTab/_constants.js
import { LOCATION_LABELS } from "@/lib/constants/labels";

export const ACTION_LABELS = {
    create: "Создание",
    update: "Изменение",
    delete: "Удаление",
    archive: "Архивация",
    unarchive: "Восстановление",

    stock_receipt: "Приход",
    stock_write_off: "Списание",
    stock_transfer: "Перемещение",
    stock_adjustment: "Корректировка",

    production_create: "Производство",
    production_void: "Отмена производства",

    user_login: "Вход",
    user_logout: "Выход",
    user_register: "Регистрация",
    user_role_change: "Смена роли",

    order_create: "Создание заказа",
    order_status_change: "Смена статуса заказа",
    order_cancel: "Отмена заказа",
};

export const ENTITY_LABELS = {
    product: "Продукт",
    product_category: "Категория продуктов",
    product_batch: "Партия",
    stock_movement: "Движение склада",
    stock_transfer: "Перемещение",
    recipe: "Рецепт",
    recipe_item: "Ингредиент рецепта",
    production_batch: "Производственная партия",
    website_product: "Товар сайта",
    website_category: "Категория сайта",
    order: "Заказ",
    user: "Пользователь",
};

// Реэкспорт — компонентам таба удобно брать всё из одного места
export { LOCATION_LABELS };

export const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
export const ENTITY_OPTIONS = Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }));
export const LOCATION_OPTIONS = Object.entries(LOCATION_LABELS).map(([value, label]) => ({ value, label }));

export const ACTION_BADGE_VARIANT = {
    create: "default",
    update: "secondary",
    delete: "destructive",
    archive: "outline",
    unarchive: "outline",

    stock_receipt: "default",
    stock_write_off: "destructive",
    stock_transfer: "secondary",
    stock_adjustment: "outline",

    production_create: "default",
    production_void: "destructive",

    user_login: "outline",
    user_logout: "outline",
    user_register: "default",
    user_role_change: "secondary",

    order_create: "default",
    order_status_change: "secondary",
    order_cancel: "destructive",
};

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];