import { pgTable, pgEnum, text } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../../schemaHelpers";
import { user } from "../auth/auth";

export const productTypeEnum = pgEnum("product_type", [
    "молочные продукты",
    "сухие ингредиенты",
    "шоколад и какао",
    "фрукты, ягоды и орехи",
    "жиры",
    "добавки и ароматизаторы",
    "прочее",
]);

export const unitEnum = pgEnum("unit", [
    "г",
    "кг",
    "мл",
    "л",
    "шт",
]);

export const ProductsTable = pgTable("products", {
    id,
    name: text("name").notNull(),
    type: productTypeEnum("type").notNull(), 
    baseUnit: unitEnum("base_unit").notNull(), 
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
    updatedAt,
});