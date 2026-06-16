// import { sql, relations } from "drizzle-orm";
// import { pgTable, text, uuid, index, check } from "drizzle-orm/pg-core";
// import { ProductsTable } from "../stock/products";
// import { ProductBatchesTable } from "../stock/productBatches";
// import { RecipesTable } from "./recipes";
// import { ProductionBatchesTable } from "./productionBatches";
// import { user } from "../auth/auth";
// import { id, createdAt, amount, money } from "../../shared/_helpers";
// import { consumptionSourceTypeEnum } from "./_enums";

// export const ProductionConsumptionsTable = pgTable(
//     "production_consumptions",
//     {
//         id: id(),

//         targetBatchId: uuid("target_batch_id").notNull().references(() => ProductionBatchesTable.id, { onDelete: "cascade" }),

//         // product_batch | production_batch
//         sourceType: consumptionSourceTypeEnum("source_type").notNull(),

//         // Если sourceType=product_batch
//         productBatchId: uuid("product_batch_id").references(() => ProductBatchesTable.id, { onDelete: "restrict" }),

//         // Если sourceType=production_batch
//         sourceBatchId: uuid("source_batch_id").references(() => ProductionBatchesTable.id, { onDelete: "restrict" }),

//         // Для удобства отчетов (что списали)
//         productId: uuid("product_id").references(() => ProductsTable.id, { onDelete: "restrict" }),
//         sourceRecipeId: uuid("source_recipe_id").references(() => RecipesTable.id, { onDelete: "restrict" }),

//         // Сколько списали (г) и какая стоимость (руб)
//         amountBase: amount("amount_base").notNull(),
//         cost: money("cost").notNull(),

//         userId: text("user_id").notNull().references(() => user.id),
//         createdAt: createdAt(),
//     },
//     (t) => [
//         index("prod_cons_target_idx").on(t.targetBatchId),
//         index("prod_cons_prod_batch_idx").on(t.productBatchId),
//         index("prod_cons_source_batch_idx").on(t.sourceBatchId),
//         index("prod_cons_product_idx").on(t.productId),
//         index("prod_cons_source_recipe_idx").on(t.sourceRecipeId),

//         check(
//             "production_consumptions_source_check",
//             sql`(
//                 (${t.sourceType} = 'product_batch' AND ${t.productBatchId} IS NOT NULL AND ${t.sourceBatchId} IS NULL)
//                 OR
//                 (${t.sourceType} = 'production_batch' AND ${t.sourceBatchId} IS NOT NULL AND ${t.productBatchId} IS NULL)
//             )`,
//         ),

//         check("production_consumptions_amount_positive_check", sql`${t.amountBase} > 0`),
//         check("production_consumptions_cost_nonneg_check", sql`${t.cost} >= 0`),
//     ],
// );

// export const productionConsumptionsRelations = relations(
//     ProductionConsumptionsTable,
//     ({ one }) => ({
//         // Куда списали (в какую производственную партию)
//         targetBatch: one(ProductionBatchesTable, {
//             fields: [ProductionConsumptionsTable.targetBatchId],
//             references: [ProductionBatchesTable.id],
//             relationName: "consumption_target",
//         }),

//         // Полиморфный источник — обе ссылки
//         productBatch: one(ProductBatchesTable, {
//             fields: [ProductionConsumptionsTable.productBatchId],
//             references: [ProductBatchesTable.id],
//         }),
//         sourceBatch: one(ProductionBatchesTable, {
//             fields: [ProductionConsumptionsTable.sourceBatchId],
//             references: [ProductionBatchesTable.id],
//             relationName: "consumption_source_production",
//         }),

//         // Дублирующие ссылки для удобства отчётов
//         product: one(ProductsTable, {
//             fields: [ProductionConsumptionsTable.productId],
//             references: [ProductsTable.id],
//         }),
//         sourceRecipe: one(RecipesTable, {
//             fields: [ProductionConsumptionsTable.sourceRecipeId],
//             references: [RecipesTable.id],
//         }),
//     }),
// );


import { sql, relations } from "drizzle-orm";
import { pgTable, text, uuid, index, check } from "drizzle-orm/pg-core";
import { ProductsTable } from "../stock/products";
import { ProductBatchesTable } from "../stock/productBatches";
import { RecipesTable } from "./recipes";
import { ProductionBatchesTable } from "./productionBatches";
import { user } from "../auth/auth";
import { id, createdAt, amount, money } from "../../shared/_helpers";
import { consumptionSourceTypeEnum } from "./_enums";

export const ProductionConsumptionsTable = pgTable(
    "production_consumptions",
    {
        id: id(),

        // Целевая производственная партия (куда списали)
        targetBatchId: uuid("target_batch_id")
            .notNull()
            .references(() => ProductionBatchesTable.id, { onDelete: "cascade" }),

        // Источник: партия продукта со склада ИЛИ партия заготовки
        sourceType: consumptionSourceTypeEnum("source_type").notNull(),

        productBatchId: uuid("product_batch_id").references(
            () => ProductBatchesTable.id,
            { onDelete: "restrict" },
        ),
        sourceBatchId: uuid("source_batch_id").references(
            () => ProductionBatchesTable.id,
            { onDelete: "restrict" },
        ),

        // Дублирующие ссылки для отчётности (что именно списали)
        productId: uuid("product_id").references(() => ProductsTable.id, {
            onDelete: "restrict",
        }),
        sourceRecipeId: uuid("source_recipe_id").references(() => RecipesTable.id, {
            onDelete: "restrict",
        }),

        amountBase: amount("amount_base").notNull(),
        cost: money("cost").notNull(),

        userId: text("user_id").notNull().references(() => user.id),
        createdAt: createdAt(),
    },
    (t) => [
        index("prod_cons_target_idx").on(t.targetBatchId),
        index("prod_cons_prod_batch_idx").on(t.productBatchId),
        index("prod_cons_source_batch_idx").on(t.sourceBatchId),
        index("prod_cons_product_idx").on(t.productId),
        index("prod_cons_source_recipe_idx").on(t.sourceRecipeId),

        check(
            "production_consumptions_source_check",
            sql`(
                (${t.sourceType} = 'product_batch'
                    AND ${t.productBatchId} IS NOT NULL
                    AND ${t.sourceBatchId} IS NULL
                    AND ${t.productId} IS NOT NULL
                    AND ${t.sourceRecipeId} IS NULL)
                OR
                (${t.sourceType} = 'production_batch'
                    AND ${t.sourceBatchId} IS NOT NULL
                    AND ${t.productBatchId} IS NULL
                    AND ${t.sourceRecipeId} IS NOT NULL
                    AND ${t.productId} IS NULL)
            )`,
        ),

        check("production_consumptions_amount_positive_check", sql`${t.amountBase} > 0`),
        check("production_consumptions_cost_nonneg_check", sql`${t.cost} >= 0`),
    ],
);

export const productionConsumptionsRelations = relations(
    ProductionConsumptionsTable,
    ({ one }) => ({
        targetBatch: one(ProductionBatchesTable, {
            fields: [ProductionConsumptionsTable.targetBatchId],
            references: [ProductionBatchesTable.id],
            relationName: "consumption_target",
        }),

        productBatch: one(ProductBatchesTable, {
            fields: [ProductionConsumptionsTable.productBatchId],
            references: [ProductBatchesTable.id],
        }),

        sourceBatch: one(ProductionBatchesTable, {
            fields: [ProductionConsumptionsTable.sourceBatchId],
            references: [ProductionBatchesTable.id],
            relationName: "consumption_source_production",
        }),

        product: one(ProductsTable, {
            fields: [ProductionConsumptionsTable.productId],
            references: [ProductsTable.id],
        }),

        sourceRecipe: one(RecipesTable, {
            fields: [ProductionConsumptionsTable.sourceRecipeId],
            references: [RecipesTable.id],
        }),
    }),
);