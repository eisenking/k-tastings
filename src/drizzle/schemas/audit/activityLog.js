import { relations } from "drizzle-orm";
import { pgTable, text, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "../auth/auth";
import { id, createdAt } from "../../shared/_helpers";
import { locationEnum } from "../../shared/enums";
import { activityActionEnum, activityEntityEnum } from "./_enums";

export const ActivityLogTable = pgTable(
    "activity_log",
    {
        id: id(),

        // Кто
        userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
        // snapshot — если пользователя удалят, история останется читаемой
        userName: text("user_name").notNull(),
        userRole: text("user_role"), // snapshot роли на момент действия

        // Что (тип события)
        action: activityActionEnum("action").notNull(),
        entity: activityEntityEnum("entity").notNull(),

        // На каком объекте — UUID (для большинства сущностей) или строка для нетипичных
        entityId: uuid("entity_id"),
        // На случай если ID нечисловой/не UUID (например, тип товара по строке)
        entityKey: text("entity_key"),

        // Где (опционально — для отчётов по локациям)
        location: locationEnum("location"),

        // Краткое человеко-читаемое описание
        // Пример: "Создал продукт «Мука»", "Списал 500г сахара"
        description: text("description").notNull(),

        // Опциональные структурированные данные
        // Например: { before: {...}, after: {...} } или { amount: 500, cost: 250 }
        metadata: jsonb("metadata"),

        // IP / User-Agent — для безопасности
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),

        createdAt: createdAt(),
    },
    (t) => [
        index("activity_log_user_idx").on(t.userId),
        index("activity_log_action_idx").on(t.action),
        index("activity_log_entity_idx").on(t.entity),
        index("activity_log_entity_id_idx").on(t.entityId),
        index("activity_log_created_at_idx").on(t.createdAt),
        index("activity_log_location_idx").on(t.location),
        
        index("activity_log_entity_lookup_idx").on(t.entity, t.entityId),
    ],
);

export const activityLogRelations = relations(ActivityLogTable, ({ one }) => ({
    user: one(user, {
        fields: [ActivityLogTable.userId],
        references: [user.id],
    }),
}));