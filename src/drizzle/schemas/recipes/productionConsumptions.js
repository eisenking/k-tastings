import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, uuid, numeric, index, check } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { user } from "../auth/auth";

import { ProductsTable } from "../products/products";
import { ProductBatchesTable } from "../products/productBatches";
import { RecipesTable } from "./recipes";
import { ProductionBatchesTable } from "./productionBatches";

export const consumptionSourceTypeEnum = pgEnum("consumption_source_type", [
    "product_batch",
    "production_batch",
]);

export const ProductionConsumptionsTable = pgTable(
    "production_consumptions",
    {
        id,

        // В какую партию производства ушло списание
        targetBatchId: uuid("target_batch_id")
            .notNull()
            .references(() => ProductionBatchesTable.id, { onDelete: "cascade" }),

        // product_batch | production_batch
        sourceType: consumptionSourceTypeEnum("source_type").notNull(),

        // Если sourceType=product_batch
        productBatchId: uuid("product_batch_id").references(() => ProductBatchesTable.id, { onDelete: "restrict" }),

        // Если sourceType=production_batch
        sourceBatchId: uuid("source_batch_id").references(() => ProductionBatchesTable.id, { onDelete: "restrict" }),

        // Для удобства отчетов (что списали)
        productId: uuid("product_id").references(() => ProductsTable.id, { onDelete: "restrict" }),
        sourceRecipeId: uuid("source_recipe_id").references(() => RecipesTable.id, { onDelete: "restrict" }),

        // Сколько списали (г) и какая стоимость (руб)
        amountBase: numeric("amount_base").notNull(),
        cost: numeric("cost").notNull(),

        userId: text("user_id").notNull().references(() => user.id),
        userName: text("user_name").notNull(),
        createdAt,
    },
    (t) => [
        index("prod_cons_target_idx").on(t.targetBatchId),
        index("prod_cons_prod_batch_idx").on(t.productBatchId),
        index("prod_cons_source_batch_idx").on(t.sourceBatchId),
        index("prod_cons_product_idx").on(t.productId),
        index("prod_cons_source_recipe_idx").on(t.sourceRecipeId),

        // Гарантия корректности полиморфной ссылки
        check(
            "production_consumptions_source_check",
            sql`(
                (${t.sourceType} = 'product_batch' AND ${t.productBatchId} IS NOT NULL AND ${t.sourceBatchId} IS NULL)
                OR
                (${t.sourceType} = 'production_batch' AND ${t.sourceBatchId} IS NOT NULL AND ${t.productBatchId} IS NULL)
            )`,
        ),

        // amountBase > 0, cost >= 0
        check("production_consumptions_amount_positive_check", sql`${t.amountBase} > 0`),
        check("production_consumptions_cost_nonneg_check", sql`${t.cost} >= 0`),
    ],
);