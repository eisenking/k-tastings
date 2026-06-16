import { sql, relations } from "drizzle-orm";
import { pgTable, uuid, timestamp, index, unique, check } from "drizzle-orm/pg-core";
import { ProductsTable } from "./products";
import { id, amount, unitCost } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";

export const StockBalancesTable = pgTable(
    "stock_balances",
    {
        id: id(),
        productId: uuid("product_id").notNull().references(() => ProductsTable.id, { onDelete: "cascade" }),
        location: locationEnum("location").notNull(),

        // Текущий остаток в граммах/мл
        totalAmount: amount("total_amount").default("0").notNull(),

        // Средневзвешенная себестоимость за грамм/мл (для быстрого отображения)
        avgUnitCost: unitCost("avg_unit_cost").default("0").notNull(),

        // Время последнего движения — для отслеживания "когда последний раз использовали"
        lastMovementAt: timestamp("last_movement_at", { withTimezone: true }),

        // Обновляется при каждом изменении баланса
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
    },
    (t) => [
        // Только одна строка на пару (product, location)
        unique("stock_balances_product_location_unique").on(t.productId, t.location),

        index("stock_balances_location_idx").on(t.location),
        index("stock_balances_total_amount_idx").on(t.totalAmount),

        check(
            "stock_balances_total_amount_nonneg_check",
            sql`${t.totalAmount} >= 0`,
        ),
        check(
            "stock_balances_avg_cost_nonneg_check",
            sql`${t.avgUnitCost} >= 0`,
        ),
    ],
);

export const stockBalancesRelations = relations(
    StockBalancesTable,
    ({ one }) => ({
        product: one(ProductsTable, {
            fields: [StockBalancesTable.productId],
            references: [ProductsTable.id],
        }),
    }),
);