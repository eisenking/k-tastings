import { timestamp, numeric, uuid } from "drizzle-orm/pg-core";

export const id = () => uuid("id").primaryKey().defaultRandom();

export const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const money = (name) => numeric(name, { precision: 14, scale: 2 });
export const amount = (name) => numeric(name, { precision: 11, scale: 3 });
export const unitCost = (name) => numeric(name, { precision: 14, scale: 6 });