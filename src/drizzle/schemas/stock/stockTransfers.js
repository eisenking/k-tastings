import { sql, relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, index, check } from "drizzle-orm/pg-core";
import { ProductsTable } from "./products";
import { ProductBatchesTable } from "./productBatches";
import { StockMovementsTable } from "./stockMovements";
import { user } from "../auth/auth";
import { id, createdAt, amount, money } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";
import { stockTransferStatusEnum } from "./_enums";

export const StockTransfersTable = pgTable(
    "stock_transfers",
    {
        id: id(),
        productId: uuid("product_id").notNull().references(() => ProductsTable.id, { onDelete: "restrict" }),

        // Откуда → Куда
        fromLocation: locationEnum("from_location").notNull(),
        toLocation: locationEnum("to_location").notNull(),

        // Сколько передано
        amountBase: amount("amount_base").notNull(),

        // Себестоимость переданного (для финансового учёта по локациям)
        totalCost: money("total_cost").notNull(),

        // Партия, из которой выдано (для FIFO-восстановления и аудита)
        // NULL если списали по нескольким партиям одновременно
        sourceBatchId: uuid("source_batch_id").references(() => ProductBatchesTable.id, { onDelete: "restrict" }),

        // Созданная партия в destination-локации
        destinationBatchId: uuid("destination_batch_id").references(() => ProductBatchesTable.id, { onDelete: "restrict" }),

        status: stockTransferStatusEnum("status").default("completed").notNull(),

        note: text("note"),

        userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
        userName: text("user_name").notNull(), // snapshot

        completedAt: timestamp("completed_at", { withTimezone: true }),
        cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
        createdAt: createdAt(),
    },
    (t) => [
        index("stock_transfers_product_idx").on(t.productId),
        index("stock_transfers_from_idx").on(t.fromLocation),
        index("stock_transfers_to_idx").on(t.toLocation),
        index("stock_transfers_status_idx").on(t.status),
        index("stock_transfers_created_at_idx").on(t.createdAt),

        // Нельзя перемещать в ту же локацию
        check(
            "stock_transfers_different_locations_check",
            sql`${t.fromLocation} <> ${t.toLocation}`,
        ),

        // Положительный объём
        check(
            "stock_transfers_amount_positive_check",
            sql`${t.amountBase} > 0`,
        ),

        check(
            "stock_transfers_cost_nonneg_check",
            sql`${t.totalCost} >= 0`,
        ),
    ],
);

export const stockTransfersRelations = relations(
    StockTransfersTable,
    ({ one, many }) => ({
        product: one(ProductsTable, {
            fields: [StockTransfersTable.productId],
            references: [ProductsTable.id],
        }),
        sourceBatch: one(ProductBatchesTable, {
            fields: [StockTransfersTable.sourceBatchId],
            references: [ProductBatchesTable.id],
            relationName: "transfer_source_batch",
        }),
        destinationBatch: one(ProductBatchesTable, {
            fields: [StockTransfersTable.destinationBatchId],
            references: [ProductBatchesTable.id],
            relationName: "transfer_destination_batch",
        }),
        movements: many(StockMovementsTable), // две связанные строки в stock_movements
    }),
);