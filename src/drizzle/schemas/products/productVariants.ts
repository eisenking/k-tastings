import { pgTable, text, uuid, numeric } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { ProductsTable, unitEnum } from "./products";
import { user } from "../auth/auth";

export const ProductVariantsTable = pgTable("product_variants", {
    id,
    productId: uuid("product_id").notNull().references(() => ProductsTable.id),
    name: text("name").notNull(),           // "Пакет 1л", "Бутылка 0.5л"
    unit: unitEnum("unit").notNull(),       // шт, л
    conversionToBase: numeric("conversion_to_base").notNull(),
    // 1 шт = 1 л
    // 1 шт = 0.5 л
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
});