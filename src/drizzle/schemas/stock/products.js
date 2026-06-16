import { relations } from "drizzle-orm";
import { pgTable, text, uuid, index } from "drizzle-orm/pg-core";
import { ProductCategoriesTable } from "./productCategories";
import { ProductBatchesTable } from "./productBatches";
import { StockMovementsTable } from "./stockMovements";
import { StockTransfersTable } from "./stockTransfers";
import { StockBalancesTable } from "./stockBalances";
import { user } from "../auth/auth";
import { id, createdAt, updatedAt, amount } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";
import { productMeasureEnum, baseUnitEnum } from "./_enums"

export const ProductsTable = pgTable("products", {
    id: id(),
    name: text("name").notNull(),
    categoryId: uuid("category_id").notNull().references(() => ProductCategoriesTable.id),
    location: locationEnum("location").notNull(),
    measure: productMeasureEnum("measure").default("mass").notNull(),
    baseUnit: baseUnitEnum("base_unit").default("g").notNull(),
    pieceToBase: amount("piece_to_base"),
    userId: text("user_id").notNull().references(() => user.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),  
},
    (t) => [
        index("products_location_idx").on(t.location),
        index("products_category_idx").on(t.categoryId),
    ]
);

export const productsRelations = relations(ProductsTable, ({ one, many }) => ({
    category: one(ProductCategoriesTable, {
        fields: [ProductsTable.categoryId],
        references: [ProductCategoriesTable.id],
    }),

    batches: many(ProductBatchesTable),
    movements: many(StockMovementsTable),
    balances: many(StockBalancesTable), 
    transfers: many(StockTransfersTable),
}));