import { pgTable, text, uuid, numeric, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { id, createdAt } from "../../schemaHelpers";
import { user } from "../auth/auth";
import { RecipesTable } from "./recipes";

export const ProductionBatchesTable = pgTable(
    "production_batches",
    {
        id,
        recipeId: uuid("recipe_id").notNull().references(() => RecipesTable.id, { onDelete: "restrict" }),
        producedBase: numeric("produced_base").notNull(),
        remainingBase: numeric("remaining_base").notNull(),
        totalCost: numeric("total_cost").notNull(),
        unitCostBase: numeric("unit_cost_base").notNull(),
        producedAt: timestamp("produced_at", { withTimezone: true }).defaultNow().notNull(),
        expirationDate: timestamp("expiration_date", { withTimezone: true }),
        note: text("note"),
        userId: text("user_id").notNull().references(() => user.id),
        userName: text("user_name").notNull(),
        createdAt,
    },
    (t) => [
        index("production_batches_recipe_idx").on(t.recipeId),
        index("production_batches_produced_at_idx").on(t.producedAt),

        check("production_batches_produced_positive_check", sql`${t.producedBase} > 0`),
        check("production_batches_remaining_nonneg_check", sql`${t.remainingBase} >= 0`),
        check("production_batches_remaining_lte_produced_check", sql`${t.remainingBase} <= ${t.producedBase}`),

        check("production_batches_total_cost_nonneg_check", sql`${t.totalCost} >= 0`),
        check("production_batches_unit_cost_nonneg_check", sql`${t.unitCostBase} >= 0`),
    ],
);