// import {
//     pgTable,
//     varchar,
//     uuid,
//     unique,
//     index,
// } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm";
// import { id, createdAt } from "../../shared/_helpers";

// // === Категории ===
// export const categories = pgTable("website_categories", {
//     id: id(),
//     name: varchar("name", { length: 100 }).notNull(),
//     slug: varchar("slug", { length: 100 }).notNull().unique(),
//     createdAt: createdAt(),
// });

// // === Подкатегории ===
// export const subcategories = pgTable(
//     "website_subcategories",
//     {
//         id: id(),
//         categoryId: uuid("category_id")
//             .references(() => categories.id, { onDelete: "cascade" })
//             .notNull(),
//         name: varchar("name", { length: 100 }).notNull(),
//         slug: varchar("slug", { length: 100 }).notNull(),
//         createdAt: createdAt(),
//     },
//     (table) => [
//         unique("subcategories_category_slug_unique").on(
//             table.categoryId,
//             table.slug
//         ),
//         index("subcategories_category_id_idx").on(table.categoryId),
//         index("subcategories_slug_idx").on(table.slug),
//     ]
// );

// // === Relations ===
// export const categoriesRelations = relations(categories, ({ many }) => ({
//     subcategories: many(subcategories),
// }));

// export const subcategoriesRelations = relations(subcategories, ({ one }) => ({
//     category: one(categories, {
//         fields: [subcategories.categoryId],
//         references: [categories.id],
//     }),
// }));

import { relations } from "drizzle-orm";
import { pgTable, varchar, uuid, unique, index } from "drizzle-orm/pg-core";
import { id, createdAt } from "../../shared/_helpers";

// === Категории ===
export const categories = pgTable("website_categories", {
    id: id(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    createdAt: createdAt(),
});

// === Подкатегории ===
export const subcategories = pgTable(
    "website_subcategories",
    {
        id: id(),
        categoryId: uuid("category_id")
            .references(() => categories.id, { onDelete: "cascade" })
            .notNull(),
        name: varchar("name", { length: 100 }).notNull(),
        slug: varchar("slug", { length: 100 }).notNull(),
        createdAt: createdAt(),
    },
    (table) => [
        unique("subcategories_category_slug_unique").on(
            table.categoryId,
            table.slug,
        ),
        index("subcategories_category_id_idx").on(table.categoryId),
        index("subcategories_slug_idx").on(table.slug),
    ],
);

// === Relations ===
// Импортируем m2m-таблицы из products.js
// (циклический импорт — но Drizzle с ним справляется)
import {
    productsToCategories,
    productsToSubcategories,
} from "./products";

export const categoriesRelations = relations(categories, ({ many }) => ({
    subcategories: many(subcategories),
    products: many(productsToCategories),
}));

export const subcategoriesRelations = relations(
    subcategories,
    ({ one, many }) => ({
        category: one(categories, {
            fields: [subcategories.categoryId],
            references: [categories.id],
        }),
        products: many(productsToSubcategories),
    }),
);