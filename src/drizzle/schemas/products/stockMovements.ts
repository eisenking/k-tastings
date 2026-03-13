import { pgTable, pgEnum, text, uuid, numeric } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { ProductsTable } from "./products";
import { ProductBatchesTable } from "./productBatches";
import { user } from "../auth/auth";

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
    "Приход",
    "Списание",
    "Перемещение",
    "Производство",
]);

export const StockMovementsTable = pgTable("stock_movements", {
    id,
    productId: uuid("product_id").notNull().references(() => ProductsTable.id),
    batchId: uuid("batch_id").references(() => ProductBatchesTable.id),
    type: stockMovementTypeEnum("type").notNull(),
    reason: text("reason"),
    amountBase: numeric("amount_base").default("0").notNull(),
    cost: numeric("cost"),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt,
});