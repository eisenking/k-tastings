import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { ProductsTable } from "./products";
import { ProductVariantsTable } from "./productVariants";
import { user } from "../auth/auth";

export const ProductBatchesTable = pgTable("product_batches", {
    id,
    productId: uuid("product_id").notNull().references(() => ProductsTable.id),
    variantId: uuid("variant_id").notNull().references(() => ProductVariantsTable.id),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    expirationDate: timestamp("expiration_date"),
    purchasePrice: numeric("purchase_price"),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
});
