// import {
//     pgTable,
//     varchar,
//     text,
//     integer,
//     boolean,
//     real,
//     uuid,
//     primaryKey,
//     index,
// } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm";
// import { categories, subcategories } from "./categories";
// import { id, createdAt, money } from "../../shared/_helpers";

// export const products = pgTable(
//     "website_products",
//     {
//         id: id(),

//         name: varchar("name", { length: 255 }).notNull(),
//         url: varchar("url", { length: 255 }).notNull().unique(),
//         type: varchar("type", { length: 100 }),
//         description: text("description"),
//         moreInfo: text("more_info"),

//         imgUrl: varchar("img_url", { length: 500 }),
//         imgAlt: varchar("img_alt", { length: 500 }),

//         price: money("price"),
//         decorType: varchar("decor_type", { length: 255 }),
//         decorPrice: money("decor_price"),

//         tiers: integer("tiers"),
//         weightOnPhoto: real("weight_on_photo"),
//         mainCover: varchar("main_cover", { length: 255 }),

//         mainCategoryLabel: varchar("main_category_label", { length: 255 }),
//         isNewProduct: boolean("is_new_product").default(false),

//         sortOrder: integer("sort_order").default(0),

//         createdAt: createdAt(),
//     },
//     (table) => [
//         index("website_products_sort_order_idx").on(table.sortOrder),
//         index("website_products_is_new_idx").on(table.isNewProduct),
//     ]
// );

// export const productsToCategories = pgTable(
//     "website_products_to_categories",
//     {
//         productId: uuid("product_id")
//             .references(() => products.id, { onDelete: "cascade" })
//             .notNull(),
//         categoryId: uuid("category_id")
//             .references(() => categories.id, { onDelete: "cascade" })
//             .notNull(),
//     },
//     (table) => [
//         primaryKey({ columns: [table.productId, table.categoryId] }),
//         index("ptc_category_id_idx").on(table.categoryId),
//     ]
// );

// export const productsToSubcategories = pgTable(
//     "website_products_to_subcategories",
//     {
//         productId: uuid("product_id")
//             .references(() => products.id, { onDelete: "cascade" })
//             .notNull(),
//         subcategoryId: uuid("subcategory_id")
//             .references(() => subcategories.id, { onDelete: "cascade" })
//             .notNull(),
//     },
//     (table) => [
//         primaryKey({ columns: [table.productId, table.subcategoryId] }),
//         index("pts_subcategory_id_idx").on(table.subcategoryId),
//     ]
// );


// export const productsRelations = relations(products, ({ many }) => ({
//     categories: many(productsToCategories),
//     subcategories: many(productsToSubcategories),
// }));

// export const productsToCategoriesRelations = relations(
//     productsToCategories,
//     ({ one }) => ({
//         product: one(products, {
//             fields: [productsToCategories.productId],
//             references: [products.id],
//         }),
//         category: one(categories, {
//             fields: [productsToCategories.categoryId],
//             references: [categories.id],
//         }),
//     })
// );

// export const productsToSubcategoriesRelations = relations(
//     productsToSubcategories,
//     ({ one }) => ({
//         product: one(products, {
//             fields: [productsToSubcategories.productId],
//             references: [products.id],
//         }),
//         subcategory: one(subcategories, {
//             fields: [productsToSubcategories.subcategoryId],
//             references: [subcategories.id],
//         }),
//     })
// );


import { relations } from "drizzle-orm";
import { pgTable, varchar, text, integer, boolean, real, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { categories, subcategories } from "./categories";
import { id, createdAt, money } from "../../shared/_helpers";

export const products = pgTable(
    "website_products",
    {
        id: id(),
        name: varchar("name", { length: 255 }).notNull(),
        url: varchar("url", { length: 255 }).notNull().unique(),
        type: varchar("type", { length: 100 }),
        description: text("description"),
        moreInfo: text("more_info"),
        imgUrl: varchar("img_url", { length: 500 }),
        imgAlt: varchar("img_alt", { length: 500 }),
        price: money("price"),
        decorType: varchar("decor_type", { length: 255 }),
        decorPrice: money("decor_price"),
        tiers: integer("tiers"),
        weightOnPhoto: real("weight_on_photo"),
        mainCover: varchar("main_cover", { length: 255 }),
        mainCategoryLabel: varchar("main_category_label", { length: 255 }),
        isNewProduct: boolean("is_new_product").default(false),
        sortOrder: integer("sort_order").default(0),
        createdAt: createdAt(),
    },
    (table) => [
        index("website_products_sort_order_idx").on(table.sortOrder),
        index("website_products_is_new_idx").on(table.isNewProduct),
    ],
);

export const productsToCategories = pgTable(
    "website_products_to_categories",
    {
        productId: uuid("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        categoryId: uuid("category_id")
            .references(() => categories.id, { onDelete: "cascade" })
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.productId, table.categoryId] }),
        index("ptc_category_id_idx").on(table.categoryId),
    ],
);

export const productsToSubcategories = pgTable(
    "website_products_to_subcategories",
    {
        productId: uuid("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        subcategoryId: uuid("subcategory_id")
            .references(() => subcategories.id, { onDelete: "cascade" })
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.productId, table.subcategoryId] }),
        index("pts_subcategory_id_idx").on(table.subcategoryId),
    ],
);

// === Relations ===

export const websiteProductsRelations = relations(products, ({ many }) => ({
    categories: many(productsToCategories),
    subcategories: many(productsToSubcategories),
}));

export const productsToCategoriesRelations = relations(
    productsToCategories,
    ({ one }) => ({
        product: one(products, {
            fields: [productsToCategories.productId],
            references: [products.id],
        }),
        category: one(categories, {
            fields: [productsToCategories.categoryId],
            references: [categories.id],
        }),
    }),
);

export const productsToSubcategoriesRelations = relations(
    productsToSubcategories,
    ({ one }) => ({
        product: one(products, {
            fields: [productsToSubcategories.productId],
            references: [products.id],
        }),
        subcategory: one(subcategories, {
            fields: [productsToSubcategories.subcategoryId],
            references: [subcategories.id],
        }),
    }),
);