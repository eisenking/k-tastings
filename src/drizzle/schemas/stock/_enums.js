import { pgEnum } from "drizzle-orm/pg-core";

export const STOCK_MOVEMENT_TYPES = [
    "receipt",        // Приход
    "write_off",      // Списание
    "transfer_out",   // Перемещение — Выдача
    "transfer_in",    // Перемещение — Приём
    "production",     // Производство
];
export const stockMovementTypeEnum = pgEnum("stock_movement_type", STOCK_MOVEMENT_TYPES);

export const STOCK_TRANSFER_STATUSES = ["pending", "completed", "cancelled"];
export const stockTransferStatusEnum = pgEnum("stock_transfer_status", STOCK_TRANSFER_STATUSES);

export const PRODUCT_MEASURES = ["mass", "volume", "piece"];
export const productMeasureEnum = pgEnum("product_measure", PRODUCT_MEASURES);

export const BASE_UNITS = ["g", "ml"];
export const baseUnitEnum = pgEnum("base_unit", BASE_UNITS);

export const UNITS = ["g", "kg", "ml", "l", "pcs"];
export const unitEnum = pgEnum("unit", UNITS);