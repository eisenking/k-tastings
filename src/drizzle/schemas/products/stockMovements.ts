import { pgTable, pgEnum, text, uuid, numeric } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { ProductsTable } from "./products";
import { ProductBatchesTable } from "./productBatches";
import { ProductVariantsTable } from "./productVariants";
import { user } from "../auth/auth";

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
    "Приход",           // in
    "Списание",        // out
    "Перемещение",    // transfer
    "Производство",  // production
]);

export const StockMovementsTable = pgTable("stock_movements", {
    id,
    productId: uuid("product_id") .notNull().references(() => ProductsTable.id),
    batchId: uuid("batch_id").references(() => ProductBatchesTable.id),
    variantId: uuid("variant_id").notNull().references(() => ProductVariantsTable.id),
    type: stockMovementTypeEnum("type").notNull(),
    quantity: numeric("quantity").notNull(),          
    quantityBase: numeric("quantity_base").notNull(),  
    reason: text("reason"),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
});