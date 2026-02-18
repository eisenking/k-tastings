CREATE TYPE "public"."product_type" AS ENUM('сырье', 'полуфабрикат', 'готовый продукт', 'упаковка');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('г', 'кг', 'мл', 'л', 'шт');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('Приход', 'Списание', 'Перемещение', 'Производство');--> statement-breakpoint
CREATE TYPE "public"."preparation_category" AS ENUM('Крема', 'Бисквиты', 'Промочки', 'Прочее');--> statement-breakpoint
CREATE TYPE "public"."recipe_type" AS ENUM('ingredient', 'preparation', 'filling');--> statement-breakpoint
CREATE TYPE "public"."recipe_item_ref_type" AS ENUM('product', 'recipe');--> statement-breakpoint
CREATE TYPE "public"."consumption_source_type" AS ENUM('product_batch', 'production_batch');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"username" text,
	"display_username" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "product_type" NOT NULL,
	"base_unit" "unit" NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"expiration_date" timestamp,
	"purchase_price" numeric,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"unit" "unit" NOT NULL,
	"conversion_to_base" numeric NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid,
	"variant_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity" numeric NOT NULL,
	"quantity_base" numeric NOT NULL,
	"reason" text,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"price" numeric NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "recipe_type" NOT NULL,
	"default_yield_base" numeric NOT NULL,
	"preparation_category" "preparation_category",
	"steps" text,
	"note" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ref_type" "recipe_item_ref_type" NOT NULL,
	"product_id" uuid,
	"child_recipe_id" uuid,
	"amount_base" numeric NOT NULL,
	"group_name" text,
	"sort_order" numeric,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_items_ref_check" CHECK ((
                ("recipe_items"."ref_type" = 'product' AND "recipe_items"."product_id" IS NOT NULL AND "recipe_items"."child_recipe_id" IS NULL)
                OR
                ("recipe_items"."ref_type" = 'recipe' AND "recipe_items"."child_recipe_id" IS NOT NULL AND "recipe_items"."product_id" IS NULL)
            )),
	CONSTRAINT "recipe_items_amount_positive_check" CHECK ("recipe_items"."amount_base" > 0)
);
--> statement-breakpoint
CREATE TABLE "production_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"produced_base" numeric NOT NULL,
	"remaining_base" numeric NOT NULL,
	"total_cost" numeric NOT NULL,
	"unit_cost_base" numeric NOT NULL,
	"produced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expiration_date" timestamp with time zone,
	"note" text,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_batches_produced_positive_check" CHECK ("production_batches"."produced_base" > 0),
	CONSTRAINT "production_batches_remaining_nonneg_check" CHECK ("production_batches"."remaining_base" >= 0),
	CONSTRAINT "production_batches_remaining_lte_produced_check" CHECK ("production_batches"."remaining_base" <= "production_batches"."produced_base"),
	CONSTRAINT "production_batches_total_cost_nonneg_check" CHECK ("production_batches"."total_cost" >= 0),
	CONSTRAINT "production_batches_unit_cost_nonneg_check" CHECK ("production_batches"."unit_cost_base" >= 0)
);
--> statement-breakpoint
CREATE TABLE "production_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_batch_id" uuid NOT NULL,
	"source_type" "consumption_source_type" NOT NULL,
	"product_batch_id" uuid,
	"source_batch_id" uuid,
	"product_id" uuid,
	"source_recipe_id" uuid,
	"amount_base" numeric NOT NULL,
	"cost" numeric NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_consumptions_source_check" CHECK ((
                ("production_consumptions"."source_type" = 'product_batch' AND "production_consumptions"."product_batch_id" IS NOT NULL AND "production_consumptions"."source_batch_id" IS NULL)
                OR
                ("production_consumptions"."source_type" = 'production_batch' AND "production_consumptions"."source_batch_id" IS NOT NULL AND "production_consumptions"."product_batch_id" IS NULL)
            )),
	CONSTRAINT "production_consumptions_amount_positive_check" CHECK ("production_consumptions"."amount_base" > 0),
	CONSTRAINT "production_consumptions_cost_nonneg_check" CHECK ("production_consumptions"."cost" >= 0)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_product_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_child_recipe_id_recipes_id_fk" FOREIGN KEY ("child_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_target_batch_id_production_batches_id_fk" FOREIGN KEY ("target_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_product_batch_id_product_batches_id_fk" FOREIGN KEY ("product_batch_id") REFERENCES "public"."product_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_source_batch_id_production_batches_id_fk" FOREIGN KEY ("source_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_source_recipe_id_recipes_id_fk" FOREIGN KEY ("source_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "recipes_type_idx" ON "recipes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "recipes_name_idx" ON "recipes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "recipe_items_recipe_idx" ON "recipe_items" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_items_product_idx" ON "recipe_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "recipe_items_child_recipe_idx" ON "recipe_items" USING btree ("child_recipe_id");--> statement-breakpoint
CREATE INDEX "production_batches_recipe_idx" ON "production_batches" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "production_batches_produced_at_idx" ON "production_batches" USING btree ("produced_at");--> statement-breakpoint
CREATE INDEX "prod_cons_target_idx" ON "production_consumptions" USING btree ("target_batch_id");--> statement-breakpoint
CREATE INDEX "prod_cons_prod_batch_idx" ON "production_consumptions" USING btree ("product_batch_id");--> statement-breakpoint
CREATE INDEX "prod_cons_source_batch_idx" ON "production_consumptions" USING btree ("source_batch_id");--> statement-breakpoint
CREATE INDEX "prod_cons_product_idx" ON "production_consumptions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "prod_cons_source_recipe_idx" ON "production_consumptions" USING btree ("source_recipe_id");