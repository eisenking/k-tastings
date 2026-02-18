import { pgTable, text, numeric, uuid, timestamp } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { ProductsTable } from "./products";
import { user } from "../auth/auth";

export const PriceHistoryTable = pgTable("price_history", {
    id,
    productId: uuid("product_id").notNull().references(() => ProductsTable.id),
    price: numeric("price").notNull(),
    validFrom: timestamp("valid_from").defaultNow().notNull(),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
});