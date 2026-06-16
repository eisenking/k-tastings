import { pgEnum } from "drizzle-orm/pg-core";

export const LOCATIONS = ["pastry", "cafe"];
export const locationEnum = pgEnum("location", LOCATIONS);