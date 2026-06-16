import { sql, relations } from "drizzle-orm";
import { pgTable, text, uuid, index, check } from "drizzle-orm/pg-core";
import { ProductsTable } from "./products";
import { ProductBatchesTable } from "./productBatches";
import { StockTransfersTable } from "./stockTransfers";
import { user } from "../auth/auth";
import { id, createdAt, money, amount } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";
import { stockMovementTypeEnum } from "./_enums";

export const StockMovementsTable = pgTable("stock_movements", {
    id: id(),
    productId: uuid("product_id").notNull().references(() => ProductsTable.id),
    batchId: uuid("batch_id").references(() => ProductBatchesTable.id),
    location: locationEnum("location").notNull(),
    type: stockMovementTypeEnum("type").notNull(),
    reason: text("reason"),
    amountBase: amount("amount_base").default("0").notNull(),
    cost: money("cost"),
    transferId: uuid("transfer_id").references(() => StockTransfersTable.id, { onDelete: "restrict" }),
    userId: text("user_id").notNull().references(() => user.id),
    userName: text("user_name").notNull(),
    createdAt: createdAt(),
},
    (t) => [
        index("stock_movements_product_idx").on(t.productId),
        index("stock_movements_location_idx").on(t.location),
        index("stock_movements_created_at_idx").on(t.createdAt),
        index("stock_movements_transfer_idx").on(t.transferId),

        check("stock_movements_transfer_id_check",
            sql`(
                (${t.type} IN ('transfer_in', 'transfer_out') AND ${t.transferId} IS NOT NULL)
                OR
                (${t.type} NOT IN ('transfer_in', 'transfer_out') AND ${t.transferId} IS NULL)
            )`,
        )  ,
    ]
);

export const stockMovementsRelations = relations(
    StockMovementsTable,
    ({ one }) => ({
        product: one(ProductsTable, {
            fields: [StockMovementsTable.productId],
            references: [ProductsTable.id],
        }),
        batch: one(ProductBatchesTable, {
            fields: [StockMovementsTable.batchId],
            references: [ProductBatchesTable.id],
        }),
        transfer: one(StockTransfersTable, {
            fields: [StockMovementsTable.transferId],
            references: [StockTransfersTable.id],
        }),
    }),
);