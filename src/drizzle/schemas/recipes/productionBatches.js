// import { sql, relations } from "drizzle-orm";
// import { pgTable, text, uuid, timestamp, index, check } from "drizzle-orm/pg-core";
// import { RecipesTable } from "./recipes";
// import { ProductionConsumptionsTable } from "./productionConsumptions";
// import { user } from "../auth/auth";
// import { id, createdAt, amount, money, unitCost } from "../../shared/_helpers";
// import { locationEnum } from "../../shared/enums";

// export const ProductionBatchesTable = pgTable(
//     "production_batches",
//     {
//         id: id(),
//         recipeId: uuid("recipe_id").notNull().references(() => RecipesTable.id, { onDelete: "restrict" }),
//         location: locationEnum("location").notNull(),
//         producedBase: amount("produced_base").notNull(),
//         remainingBase: amount("remaining_base").notNull(),
//         totalCost: money("total_cost").notNull(),
//         unitCostBase: unitCost("unit_cost_base").notNull(),
//         producedAt: timestamp("produced_at", { withTimezone: true }).defaultNow().notNull(),
//         expirationDate: timestamp("expiration_date", { withTimezone: true }),
//         note: text("note"),
//         userId: text("user_id").notNull().references(() => user.id),
//         userName: text("user_name").notNull(),
//         createdAt: createdAt(),
//     },
//     (t) => [
//         index("production_batches_recipe_idx").on(t.recipeId),
//         index("production_batches_produced_at_idx").on(t.producedAt),
//         index("production_batches_location_idx").on(t.location),
//         index("production_batches_fifo_idx").on(t.recipeId, t.location, t.producedAt),

//         check("production_batches_produced_positive_check", sql`${t.producedBase} > 0`),
//         check("production_batches_remaining_nonneg_check", sql`${t.remainingBase} >= 0`),
//         check("production_batches_remaining_lte_produced_check", sql`${t.remainingBase} <= ${t.producedBase}`),

//         check("production_batches_total_cost_nonneg_check", sql`${t.totalCost} >= 0`),
//         check("production_batches_unit_cost_nonneg_check", sql`${t.unitCostBase} >= 0`),
//     ],
// );

// export const productionBatchesRelations = relations(
//     ProductionBatchesTable,
//     ({ one, many }) => ({
//         recipe: one(RecipesTable, {
//             fields: [ProductionBatchesTable.recipeId],
//             references: [RecipesTable.id],
//         }),

//         // Что было списано на производство этой партии (входящий ресурс)
//         consumptions: many(ProductionConsumptionsTable, {
//             relationName: "consumption_target",
//         }),

//         // Куда эта партия была списана (если использовали её как ингредиент)
//         usedInConsumptions: many(ProductionConsumptionsTable, {
//             relationName: "consumption_source_production",
//         }),
//     }),
// );



import { sql, relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, index, check } from "drizzle-orm/pg-core";
import { RecipesTable } from "./recipes";
import { ProductionConsumptionsTable } from "./productionConsumptions";
import { user } from "../auth/auth";
import { id, createdAt, amount, money, unitCost } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";

export const ProductionBatchesTable = pgTable(
    "production_batches",
    {
        id: id(),

        recipeId: uuid("recipe_id")
            .notNull()
            .references(() => RecipesTable.id, { onDelete: "restrict" }),

        // Локация партии = локация рецепта (дублируется для удобства фильтрации)
        location: locationEnum("location").notNull(),

        producedBase: amount("produced_base").notNull(),
        remainingBase: amount("remaining_base").notNull(),

        totalCost: money("total_cost").notNull(),
        unitCostBase: unitCost("unit_cost_base").notNull(),

        producedAt: timestamp("produced_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        expirationDate: timestamp("expiration_date", { withTimezone: true }),

        note: text("note"),

        userId: text("user_id").notNull().references(() => user.id),

        createdAt: createdAt(),
    },
    (t) => [
        index("production_batches_recipe_idx").on(t.recipeId),
        index("production_batches_produced_at_idx").on(t.producedAt),
        index("production_batches_location_idx").on(t.location),
        // FIFO-индекс: подбор партий заготовки по рецепту/локации в порядке производства
        index("production_batches_fifo_idx").on(t.recipeId, t.location, t.producedAt),

        check("production_batches_produced_positive_check", sql`${t.producedBase} > 0`),
        check("production_batches_remaining_nonneg_check", sql`${t.remainingBase} >= 0`),
        check(
            "production_batches_remaining_lte_produced_check",
            sql`${t.remainingBase} <= ${t.producedBase}`,
        ),
        check("production_batches_total_cost_nonneg_check", sql`${t.totalCost} >= 0`),
        check("production_batches_unit_cost_nonneg_check", sql`${t.unitCostBase} >= 0`),
    ],
);

export const productionBatchesRelations = relations(
    ProductionBatchesTable,
    ({ one, many }) => ({
        recipe: one(RecipesTable, {
            fields: [ProductionBatchesTable.recipeId],
            references: [RecipesTable.id],
        }),

        author: one(user, {
            fields: [ProductionBatchesTable.userId],
            references: [user.id],
        }),

        // Что было списано на производство этой партии (входящий ресурс)
        consumptions: many(ProductionConsumptionsTable, {
            relationName: "consumption_target",
        }),

        // Куда эта партия была списана (если использовалась как ингредиент)
        usedInConsumptions: many(ProductionConsumptionsTable, {
            relationName: "consumption_source_production",
        }),
    }),
);