import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, uuid, numeric, index, check } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../schemaHelpers";
import { user } from "../auth/auth";

import { RecipesTable } from "./recipes";
import { ProductsTable } from "../products/products";

export const recipeItemRefTypeEnum = pgEnum("recipe_item_ref_type", [
    "product",
    "recipe",
]);

export const RecipeItemsTable = pgTable(
    "recipe_items",
    {
        id,

        recipeId: uuid("recipe_id").notNull().references(() => RecipesTable.id, { onDelete: "cascade" }),

        // product | recipe
        refType: recipeItemRefTypeEnum("ref_type").notNull(),

        // Если refType=product
        productId: uuid("product_id").references(() => ProductsTable.id, { onDelete: "restrict" }),

        // Если refType=recipe (подрецепт/заготовка)
        childRecipeId: uuid("child_recipe_id").references(() => RecipesTable.id, { onDelete: "restrict" }),

        // Кол-во в граммах для recipe.defaultYieldBase
        amountBase: numeric("amount_base").notNull(),

        // На будущее: группы/секции/сортировка
        groupName: text("group_name"),
        sortOrder: numeric("sort_order"),

        userId: text("user_id").notNull().references(() => user.id),
        userName: text("user_name").notNull(),
        createdAt,
    },
    (t) => [
        index("recipe_items_recipe_idx").on(t.recipeId),
        index("recipe_items_product_idx").on(t.productId),
        index("recipe_items_child_recipe_idx").on(t.childRecipeId),

        // Гарантия целостности полиморфной ссылки
        check(
            "recipe_items_ref_check",
            sql`(
                (${t.refType} = 'product' AND ${t.productId} IS NOT NULL AND ${t.childRecipeId} IS NULL)
                OR
                (${t.refType} = 'recipe' AND ${t.childRecipeId} IS NOT NULL AND ${t.productId} IS NULL)
            )`,
        ),

        // Кол-во должно быть > 0
        check("recipe_items_amount_positive_check", sql`${t.amountBase} > 0`),
    ],
);