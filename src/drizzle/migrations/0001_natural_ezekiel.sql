CREATE TYPE "public"."recipe_category" AS ENUM('creams', 'biscuits', 'soaks', 'other_pastry', 'sauces', 'marinades', 'cuts', 'broths', 'other_cafe', 'first_courses', 'main_courses', 'sides', 'desserts');--> statement-breakpoint
ALTER TABLE "recipes" RENAME COLUMN "preparation_category" TO "category";--> statement-breakpoint
ALTER TABLE "production_consumptions" DROP CONSTRAINT "production_consumptions_source_check";--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."recipe_type";--> statement-breakpoint
CREATE TYPE "public"."recipe_type" AS ENUM('preparation', 'filling', 'dish');--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "type" SET DATA TYPE "public"."recipe_type" USING "type"::"public"."recipe_type";--> statement-breakpoint
CREATE INDEX "recipes_location_idx" ON "recipes" USING btree ("location");--> statement-breakpoint
CREATE INDEX "recipes_category_idx" ON "recipes" USING btree ("category");--> statement-breakpoint
ALTER TABLE "production_batches" DROP COLUMN "user_name";--> statement-breakpoint
ALTER TABLE "recipe_items" DROP COLUMN "group_name";--> statement-breakpoint
ALTER TABLE "recipe_items" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_source_check" CHECK ((
                ("production_consumptions"."source_type" = 'product_batch'
                    AND "production_consumptions"."product_batch_id" IS NOT NULL
                    AND "production_consumptions"."source_batch_id" IS NULL
                    AND "production_consumptions"."product_id" IS NOT NULL
                    AND "production_consumptions"."source_recipe_id" IS NULL)
                OR
                ("production_consumptions"."source_type" = 'production_batch'
                    AND "production_consumptions"."source_batch_id" IS NOT NULL
                    AND "production_consumptions"."product_batch_id" IS NULL
                    AND "production_consumptions"."source_recipe_id" IS NOT NULL
                    AND "production_consumptions"."product_id" IS NULL)
            ));--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_no_self_ref_check" CHECK ("recipe_items"."child_recipe_id" IS NULL OR "recipe_items"."child_recipe_id" <> "recipe_items"."recipe_id");--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_required_check" CHECK ((
                ("recipes"."type" = 'filling' AND "recipes"."category" IS NULL)
                OR
                ("recipes"."type" IN ('preparation', 'dish') AND "recipes"."category" IS NOT NULL)
            ));--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_default_yield_positive_check" CHECK ("recipes"."default_yield_base" > 0);--> statement-breakpoint
DROP TYPE "public"."preparation_category";