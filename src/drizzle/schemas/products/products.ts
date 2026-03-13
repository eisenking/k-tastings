import { pgTable, pgEnum, text, numeric } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../../schemaHelpers";
import { user } from "../auth/auth";

export const productCategoryEnum = pgEnum("product_type", [
    "Молочные",
    "Сухие", 
    "Жиры",
    "Фрукты/Ягоды",
    "Орехи",
    "Шоколад",
    "Добавки", 
    "Прочее",
]);

export const productMeasureEnum = pgEnum("product_measure", [
    "mass",
    "volume",
]);

export const baseUnitEnum = pgEnum("base_unit", ["г", "мл"]);

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
    category: productCategoryEnum("category").notNull(),
    measure: productMeasureEnum("measure").default("mass").notNull(),
    baseUnit: baseUnitEnum("base_unit").default("г").notNull(),
    pieceToBase: numeric("piece_to_base"),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
    updatedAt,
});