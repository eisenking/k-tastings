import { pgEnum } from "drizzle-orm/pg-core";

export const ACTIVITY_ACTIONS = [
    // CRUD
    "create",
    "update",
    "delete",
    "archive",
    "unarchive",
    
    // Складские операции
    "stock_receipt",      // приход партии
    "stock_write_off",    // списание
    "stock_transfer",     // перемещение
    "stock_adjustment",   // корректировка остатков
    
    // Производство
    "production_create",  // произвели партию
    "production_void",    // отменили партию
    
    // Авторизация
    "user_login",
    "user_logout",
    "user_register",
    "user_role_change",
    
    // Заказы (на будущее)
    "order_create",
    "order_status_change",
    "order_cancel",
];
export const activityActionEnum = pgEnum("activity_action", ACTIVITY_ACTIONS);

export const ACTIVITY_ENTITIES = [
    "product",
    "product_category",
    "product_batch",
    "stock_movement",
    "stock_transfer",
    "recipe",
    "recipe_item",
    "production_batch",
    "website_product",
    "website_category",
    "order",
    "user",
];
export const activityEntityEnum = pgEnum("activity_entity", ACTIVITY_ENTITIES);