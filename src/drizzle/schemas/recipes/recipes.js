// import { relations } from "drizzle-orm";
// import { pgTable, text, boolean, index, unique } from "drizzle-orm/pg-core";
// import { RecipeItemsTable } from "./recipeItems";
// import { ProductionBatchesTable } from "./productionBatches";
// import { user } from "../auth/auth";
// import { id, createdAt, updatedAt, amount } from "../../shared/_helpers";
// import { locationEnum } from "../../shared/enums";
// import { recipeTypeEnum, preparationCategoryEnum } from "./_enums";

// export const RecipesTable = pgTable(
//     "recipes",
//     {
//         id: id(),

//         name: text("name").notNull(),
//         type: recipeTypeEnum("type").notNull(),
//         location: locationEnum("location").notNull(),

//         // Всегда в граммах, по умолчанию для начинок 1000
//         defaultYieldBase: amount("default_yield_base").notNull(),

//         // Только для preparation, иначе null
//         preparationCategory: preparationCategoryEnum("preparation_category"),

//         note: text("note"),

//         isArchived: boolean("is_archived").default(false).notNull(),

//         userId: text("user_id").notNull().references(() => user.id),

//         createdAt: createdAt(),
//         updatedAt: updatedAt(),
//     },
//     (t) => [
//         index("recipes_type_idx").on(t.type),
//         index("recipes_name_idx").on(t.name),

//         unique("recipes_name_type_location_unique").on(t.name, t.type, t.location),
//     ],
// );

// export const recipesRelations = relations(RecipesTable, ({ many }) => ({
//     // Прямые ингредиенты этого рецепта
//     items: many(RecipeItemsTable, { relationName: "recipe_items_owner" }),

//     // Места, где ЭТОТ рецепт используется как ингредиент в других рецептах
//     usedInItems: many(RecipeItemsTable, { relationName: "recipe_items_child" }),

//     // Все произведённые партии по этому рецепту
//     productionBatches: many(ProductionBatchesTable),
// }));


import { sql, relations } from "drizzle-orm";
import { pgTable, text, boolean, index, unique, check } from "drizzle-orm/pg-core";
import { RecipeItemsTable } from "./recipeItems";
import { ProductionBatchesTable } from "./productionBatches";
import { user } from "../auth/auth";
import { id, createdAt, updatedAt, amount } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";
import { recipeTypeEnum, recipeCategoryEnum } from "./_enums";

export const RecipesTable = pgTable(
    "recipes",
    {
        id: id(),

        name: text("name").notNull(),
        type: recipeTypeEnum("type").notNull(),
        location: locationEnum("location").notNull(),

        // Дефолтный выход рецепта в базовых единицах (граммах).
        // Для начинок/блюд обычно 1000г, для заготовок — сумма ингредиентов.
        defaultYieldBase: amount("default_yield_base").notNull(),

        // Категория: обязательна для preparation/dish, NULL для filling.
        // Корректность сочетания type ↔ category проверяется CHECK ниже.
        category: recipeCategoryEnum("category"),

        note: text("note"),

        isArchived: boolean("is_archived").default(false).notNull(),

        userId: text("user_id").notNull().references(() => user.id),

        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (t) => [
        index("recipes_type_idx").on(t.type),
        index("recipes_name_idx").on(t.name),
        index("recipes_location_idx").on(t.location),
        index("recipes_category_idx").on(t.category),

        // Уникальность в рамках (имя + тип + локация)
        unique("recipes_name_type_location_unique").on(t.name, t.type, t.location),

        // filling — без категории; preparation/dish — обязательно с категорией
        check(
            "recipes_category_required_check",
            sql`(
                (${t.type} = 'filling' AND ${t.category} IS NULL)
                OR
                (${t.type} IN ('preparation', 'dish') AND ${t.category} IS NOT NULL)
            )`,
        ),

        check("recipes_default_yield_positive_check", sql`${t.defaultYieldBase} > 0`),
    ],
);

export const recipesRelations = relations(RecipesTable, ({ many, one }) => ({
    // Автор рецепта
    author: one(user, {
        fields: [RecipesTable.userId],
        references: [user.id],
    }),

    // Прямые ингредиенты этого рецепта
    items: many(RecipeItemsTable, { relationName: "recipe_items_owner" }),

    // Места, где ЭТОТ рецепт используется как ингредиент в других рецептах
    usedInItems: many(RecipeItemsTable, { relationName: "recipe_items_child" }),

    // Все произведённые партии по этому рецепту
    productionBatches: many(ProductionBatchesTable),
}));