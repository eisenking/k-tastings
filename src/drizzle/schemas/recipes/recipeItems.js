// import { sql, relations } from "drizzle-orm";
// import { pgTable, text, uuid, integer, index, check, uniqueIndex } from "drizzle-orm/pg-core";
// import { RecipesTable } from "./recipes";
// import { ProductsTable } from "../stock/products";
// import { id, createdAt, amount } from "../../shared/_helpers";
// import { user } from "../auth/auth";
// import { recipeItemRefTypeEnum } from "./_enums";

// export const RecipeItemsTable = pgTable(
//     "recipe_items",
//     {
//         id: id(),

//         recipeId: uuid("recipe_id").notNull().references(() => RecipesTable.id, { onDelete: "cascade" }),
        
//         refType: recipeItemRefTypeEnum("ref_type").notNull(),

        
//         productId: uuid("product_id").references(() => ProductsTable.id, { onDelete: "restrict" }),

        
//         childRecipeId: uuid("child_recipe_id").references(() => RecipesTable.id, { onDelete: "restrict" }),

        
//         amountBase: amount("amount_base").notNull(),

//         groupName: text("group_name"),
//         sortOrder: integer("sort_order"),

//         userId: text("user_id").notNull().references(() => user.id),
//         createdAt: createdAt(),
//     },
//     (t) => [
//         index("recipe_items_recipe_idx").on(t.recipeId),
//         index("recipe_items_product_idx").on(t.productId),
//         index("recipe_items_child_recipe_idx").on(t.childRecipeId),

//         check(
//             "recipe_items_ref_check",
//             sql`(
//                 (${t.refType} = 'product' AND ${t.productId} IS NOT NULL AND ${t.childRecipeId} IS NULL)
//                 OR
//                 (${t.refType} = 'recipe' AND ${t.childRecipeId} IS NOT NULL AND ${t.productId} IS NULL)
//             )`,
//         ),

//         check("recipe_items_amount_positive_check", sql`${t.amountBase} > 0`),

//         uniqueIndex("recipe_items_unique_product").on(t.recipeId, t.productId).where(sql`${t.refType} = 'product'`),
    
//         uniqueIndex("recipe_items_unique_recipe").on(t.recipeId, t.childRecipeId).where(sql`${t.refType} = 'recipe'`),

//     ],
// );

// export const recipeItemsRelations = relations(RecipeItemsTable, ({ one }) => ({
//     // Родительский рецепт (которому принадлежит этот item)
//     recipe: one(RecipesTable, {
//         fields: [RecipeItemsTable.recipeId],
//         references: [RecipesTable.id],
//         relationName: "recipe_items_owner",
//     }),

//     // Полиморфные ссылки — обе описываем, в коде смотришь по refType
//     product: one(ProductsTable, {
//         fields: [RecipeItemsTable.productId],
//         references: [ProductsTable.id],
//     }),
//     childRecipe: one(RecipesTable, {
//         fields: [RecipeItemsTable.childRecipeId],
//         references: [RecipesTable.id],
//         relationName: "recipe_items_child",
//     }),
// }));


import { sql, relations } from "drizzle-orm";
import { pgTable, uuid, text, index, check, uniqueIndex } from "drizzle-orm/pg-core";
import { RecipesTable } from "./recipes";
import { ProductsTable } from "../stock/products";
import { user } from "../auth/auth";
import { id, createdAt, amount } from "../../shared/_helpers";
import { recipeItemRefTypeEnum } from "./_enums";

export const RecipeItemsTable = pgTable(
    "recipe_items",
    {
        id: id(),

        // Родительский рецепт
        recipeId: uuid("recipe_id")
            .notNull()
            .references(() => RecipesTable.id, { onDelete: "cascade" }),

        // Полиморфная ссылка: продукт со склада ИЛИ подрецепт (заготовка)
        refType: recipeItemRefTypeEnum("ref_type").notNull(),

        productId: uuid("product_id").references(() => ProductsTable.id, {
            onDelete: "restrict",
        }),
        childRecipeId: uuid("child_recipe_id").references(() => RecipesTable.id, {
            onDelete: "restrict",
        }),

        // Кол-во в базовых единицах (г)
        amountBase: amount("amount_base").notNull(),

        userId: text("user_id").notNull().references(() => user.id),
        createdAt: createdAt(),
    },
    (t) => [
        index("recipe_items_recipe_idx").on(t.recipeId),
        index("recipe_items_product_idx").on(t.productId),
        index("recipe_items_child_recipe_idx").on(t.childRecipeId),

        // Согласованность полиморфных ссылок
        check(
            "recipe_items_ref_check",
            sql`(
                (${t.refType} = 'product' AND ${t.productId} IS NOT NULL AND ${t.childRecipeId} IS NULL)
                OR
                (${t.refType} = 'recipe' AND ${t.childRecipeId} IS NOT NULL AND ${t.productId} IS NULL)
            )`,
        ),

        check("recipe_items_amount_positive_check", sql`${t.amountBase} > 0`),

        // Запрет дублей продукта/подрецепта в одном рецепте
        uniqueIndex("recipe_items_unique_product")
            .on(t.recipeId, t.productId)
            .where(sql`${t.refType} = 'product'`),

        uniqueIndex("recipe_items_unique_recipe")
            .on(t.recipeId, t.childRecipeId)
            .where(sql`${t.refType} = 'recipe'`),

        // Запрет самоссылки (рецепт не может быть ингредиентом самого себя)
        check(
            "recipe_items_no_self_ref_check",
            sql`${t.childRecipeId} IS NULL OR ${t.childRecipeId} <> ${t.recipeId}`,
        ),
    ],
);

// ⚠ Импорт text — пришлось переставить ниже, фиксим:
// (уже импортирован выше — это просто заметка для тебя; в JS нет проблем с порядком)

export const recipeItemsRelations = relations(RecipeItemsTable, ({ one }) => ({
    recipe: one(RecipesTable, {
        fields: [RecipeItemsTable.recipeId],
        references: [RecipesTable.id],
        relationName: "recipe_items_owner",
    }),

    product: one(ProductsTable, {
        fields: [RecipeItemsTable.productId],
        references: [ProductsTable.id],
    }),

    childRecipe: one(RecipesTable, {
        fields: [RecipeItemsTable.childRecipeId],
        references: [RecipesTable.id],
        relationName: "recipe_items_child",
    }),
}));