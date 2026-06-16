import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { ProductsTable } from "./products";
import { user } from "../auth/auth";
import { id, createdAt, updatedAt } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";

export const ProductCategoriesTable = pgTable("product_categories",
    {
        id:id(),
        name: text("name").notNull(),
        location: locationEnum("location").notNull(),
        archivedAt: timestamp("archived_at"),
        userId: text("user_id").notNull().references(() => user.id),
        createdAt: createdAt(),
        updatedAt: updatedAt(),
    },
    (table) => [
        unique("unique_name_per_location").on(table.name, table.location),
    ]
);

export const productCategoriesRelations = relations(
    ProductCategoriesTable,
    ({ many }) => ({
        products: many(ProductsTable),
    }),
);