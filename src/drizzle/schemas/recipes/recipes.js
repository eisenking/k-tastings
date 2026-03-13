import { pgEnum, pgTable, text, numeric, boolean, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../../schemaHelpers";
import { user } from "../auth/auth";

export const recipeTypeEnum = pgEnum("recipe_type", [
    "ingredient",
    "preparation",
    "filling",
]);

export const preparationCategoryEnum = pgEnum("preparation_category", [
    "Крема",
    "Бисквиты",
    "Промочки",
    "Прочее",
]);

export const RecipesTable = pgTable(
    "recipes",
    {
        id,

        name: text("name").notNull(),
        type: recipeTypeEnum("type").notNull(),

        // Всегда в граммах, по умолчанию для начинок 1000
        defaultYieldBase: numeric("default_yield_base").notNull(),

        // Только для preparation, иначе null
        preparationCategory: preparationCategoryEnum("preparation_category"),

        note: text("note"),

        isArchived: boolean("is_archived").default(false).notNull(),

        userId: text("user_id").notNull().references(() => user.id),
        userName: text("user_name").notNull(),

        createdAt,
        updatedAt,
    },
    (t) => [
        index("recipes_type_idx").on(t.type),
        index("recipes_name_idx").on(t.name),
    ],
);