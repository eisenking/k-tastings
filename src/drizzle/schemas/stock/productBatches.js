import { sql, relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, check, index } from "drizzle-orm/pg-core";
import { ProductsTable } from "./products";
import { StockMovementsTable } from "./stockMovements";
import { user } from "../auth/auth";
import { id, createdAt, money, unitCost, amount } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";

export const ProductBatchesTable = pgTable("product_batches", {
    id: id(),
    productId: uuid("product_id").notNull().references(() => ProductsTable.id),
    location: locationEnum("location").notNull(),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    expirationDate: timestamp("expiration_date"),
    receivedBase: amount("received_base").default("0").notNull(),
    remainingBase: amount("remaining_base").default("0").notNull(), 
    totalCost: money("total_cost").default("0").notNull(),
    unitCostBase: unitCost("unit_cost_base").default("0").notNull(),
    sourceBatchId: uuid("source_batch_id").references(() => ProductBatchesTable.id, { onDelete: "restrict" }),
    userId: text("user_id").notNull().references(() => user.id),
    createdAt: createdAt(),
},
    (t) => [
        index("product_batches_product_idx").on(t.productId),
        index("product_batches_location_idx").on(t.location),
        index("product_batches_received_at_idx").on(t.receivedAt),
        index("product_batches_fifo_idx").on(t.productId,t.location,t.receivedAt),

        check("product_batches_remaining_nonneg_check", sql`${t.remainingBase} >= 0`),
        check("product_batches_remaining_lte_received_check", sql`${t.remainingBase} <= ${t.receivedBase}`),
    ]
);

export const productBatchesRelations = relations(
    ProductBatchesTable,
    ({ one, many }) => ({
        product: one(ProductsTable, {
            fields: [ProductBatchesTable.productId],
            references: [ProductsTable.id],
        }),

        // self-reference: эта партия создана из другой (через transfer)
        sourceBatch: one(ProductBatchesTable, {
            fields: [ProductBatchesTable.sourceBatchId],
            references: [ProductBatchesTable.id],
            relationName: "batch_source_link", // обязательно для self-ref
        }),

        // обратная сторона self-reference: партии, созданные из этой
        derivedBatches: many(ProductBatchesTable, {
            relationName: "batch_source_link",
        }),

        // все движения этой партии
        movements: many(StockMovementsTable),
    }),
);