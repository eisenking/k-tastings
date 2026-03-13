import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { ProductsTable } from "./products";
import { user } from "../auth/auth";

export const ProductBatchesTable = pgTable("product_batches", {
    id,
    productId: uuid("product_id").notNull().references(() => ProductsTable.id),

    receivedAt: timestamp("received_at").defaultNow().notNull(),
    expirationDate: timestamp("expiration_date"),

    // NEW (base)
    receivedBase: numeric("received_base").default("0").notNull(),  // г/мл
    totalCost: numeric("total_cost").default("0").notNull(),        // руб
    unitCostBase: numeric("unit_cost_base").default("0").notNull(), // руб/г или руб/мл

    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
});