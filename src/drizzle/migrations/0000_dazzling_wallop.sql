CREATE TYPE "public"."location" AS ENUM('pastry', 'cafe');--> statement-breakpoint
CREATE TYPE "public"."activity_action" AS ENUM('create', 'update', 'delete', 'archive', 'unarchive', 'stock_receipt', 'stock_write_off', 'stock_transfer', 'stock_adjustment', 'production_create', 'production_void', 'user_login', 'user_logout', 'user_register', 'user_role_change', 'order_create', 'order_status_change', 'order_cancel');--> statement-breakpoint
CREATE TYPE "public"."activity_entity" AS ENUM('product', 'product_category', 'product_batch', 'stock_movement', 'stock_transfer', 'recipe', 'recipe_item', 'production_batch', 'website_product', 'website_category', 'order', 'user');--> statement-breakpoint
CREATE TYPE "public"."consumption_source_type" AS ENUM('product_batch', 'production_batch');--> statement-breakpoint
CREATE TYPE "public"."preparation_category" AS ENUM('creams', 'biscuits', 'soaks', 'other');--> statement-breakpoint
CREATE TYPE "public"."recipe_item_ref_type" AS ENUM('product', 'recipe');--> statement-breakpoint
CREATE TYPE "public"."recipe_type" AS ENUM('ingredient', 'preparation', 'filling');--> statement-breakpoint
CREATE TYPE "public"."base_unit" AS ENUM('g', 'ml');--> statement-breakpoint
CREATE TYPE "public"."product_measure" AS ENUM('mass', 'volume', 'piece');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('receipt', 'write_off', 'transfer_out', 'transfer_in', 'production');--> statement-breakpoint
CREATE TYPE "public"."stock_transfer_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('g', 'kg', 'ml', 'l', 'pcs');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"user_name" text NOT NULL,
	"user_role" text,
	"action" "activity_action" NOT NULL,
	"entity" "activity_entity" NOT NULL,
	"entity_id" uuid,
	"entity_key" text,
	"location" "location",
	"description" text NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "production_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"location" "location" NOT NULL,
	"produced_base" numeric(11, 3) NOT NULL,
	"remaining_base" numeric(11, 3) NOT NULL,
	"total_cost" numeric(14, 2) NOT NULL,
	"unit_cost_base" numeric(14, 6) NOT NULL,
	"produced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expiration_date" timestamp with time zone,
	"note" text,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"amount_base" numeric(11, 3) NOT NULL,
	"cost" numeric(14, 2) NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_consumptions_source_check" CHECK ((
                ("production_consumptions"."source_type" = 'product_batch' AND "production_consumptions"."product_batch_id" IS NOT NULL AND "production_consumptions"."source_batch_id" IS NULL)
                OR
                ("production_consumptions"."source_type" = 'production_batch' AND "production_consumptions"."source_batch_id" IS NOT NULL AND "production_consumptions"."product_batch_id" IS NULL)
            )),
	CONSTRAINT "production_consumptions_amount_positive_check" CHECK ("production_consumptions"."amount_base" > 0),
	CONSTRAINT "production_consumptions_cost_nonneg_check" CHECK ("production_consumptions"."cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ref_type" "recipe_item_ref_type" NOT NULL,
	"product_id" uuid,
	"child_recipe_id" uuid,
	"amount_base" numeric(11, 3) NOT NULL,
	"group_name" text,
	"sort_order" integer,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_items_ref_check" CHECK ((
                ("recipe_items"."ref_type" = 'product' AND "recipe_items"."product_id" IS NOT NULL AND "recipe_items"."child_recipe_id" IS NULL)
                OR
                ("recipe_items"."ref_type" = 'recipe' AND "recipe_items"."child_recipe_id" IS NOT NULL AND "recipe_items"."product_id" IS NULL)
            )),
	CONSTRAINT "recipe_items_amount_positive_check" CHECK ("recipe_items"."amount_base" > 0)
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "recipe_type" NOT NULL,
	"location" "location" NOT NULL,
	"default_yield_base" numeric(11, 3) NOT NULL,
	"preparation_category" "preparation_category",
	"note" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_name_type_location_unique" UNIQUE("name","type","location")
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" "location" NOT NULL,
	"archived_at" timestamp,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_name_per_location" UNIQUE("name","location")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid NOT NULL,
	"location" "location" NOT NULL,
	"measure" "product_measure" DEFAULT 'mass' NOT NULL,
	"base_unit" "base_unit" DEFAULT 'g' NOT NULL,
	"piece_to_base" numeric(11, 3),
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"location" "location" NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"expiration_date" timestamp,
	"received_base" numeric(11, 3) DEFAULT '0' NOT NULL,
	"remaining_base" numeric(11, 3) DEFAULT '0' NOT NULL,
	"total_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"unit_cost_base" numeric(14, 6) DEFAULT '0' NOT NULL,
	"source_batch_id" uuid,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_batches_remaining_nonneg_check" CHECK ("product_batches"."remaining_base" >= 0),
	CONSTRAINT "product_batches_remaining_lte_received_check" CHECK ("product_batches"."remaining_base" <= "product_batches"."received_base")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid,
	"location" "location" NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"reason" text,
	"amount_base" numeric(11, 3) DEFAULT '0' NOT NULL,
	"cost" numeric(14, 2),
	"transfer_id" uuid,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_transfer_id_check" CHECK ((
                ("stock_movements"."type" IN ('transfer_in', 'transfer_out') AND "stock_movements"."transfer_id" IS NOT NULL)
                OR
                ("stock_movements"."type" NOT IN ('transfer_in', 'transfer_out') AND "stock_movements"."transfer_id" IS NULL)
            ))
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"from_location" "location" NOT NULL,
	"to_location" "location" NOT NULL,
	"amount_base" numeric(11, 3) NOT NULL,
	"total_cost" numeric(14, 2) NOT NULL,
	"source_batch_id" uuid,
	"destination_batch_id" uuid,
	"status" "stock_transfer_status" DEFAULT 'completed' NOT NULL,
	"note" text,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_transfers_different_locations_check" CHECK ("stock_transfers"."from_location" <> "stock_transfers"."to_location"),
	CONSTRAINT "stock_transfers_amount_positive_check" CHECK ("stock_transfers"."amount_base" > 0),
	CONSTRAINT "stock_transfers_cost_nonneg_check" CHECK ("stock_transfers"."total_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"location" "location" NOT NULL,
	"total_amount" numeric(11, 3) DEFAULT '0' NOT NULL,
	"avg_unit_cost" numeric(14, 6) DEFAULT '0' NOT NULL,
	"last_movement_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_balances_product_location_unique" UNIQUE("product_id","location"),
	CONSTRAINT "stock_balances_total_amount_nonneg_check" CHECK ("stock_balances"."total_amount" >= 0),
	CONSTRAINT "stock_balances_avg_cost_nonneg_check" CHECK ("stock_balances"."avg_unit_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "website_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(255) NOT NULL,
	"type" varchar(100),
	"description" text,
	"more_info" text,
	"img_url" varchar(500),
	"img_alt" varchar(500),
	"price" numeric(14, 2),
	"decor_type" varchar(255),
	"decor_price" numeric(14, 2),
	"tiers" integer,
	"weight_on_photo" real,
	"main_cover" varchar(255),
	"main_category_label" varchar(255),
	"is_new_product" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "website_products_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "website_products_to_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "website_products_to_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "website_products_to_subcategories" (
	"product_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL,
	CONSTRAINT "website_products_to_subcategories_product_id_subcategory_id_pk" PRIMARY KEY("product_id","subcategory_id")
);
--> statement-breakpoint
CREATE TABLE "website_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "website_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "website_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subcategories_category_slug_unique" UNIQUE("category_id","slug")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_target_batch_id_production_batches_id_fk" FOREIGN KEY ("target_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_product_batch_id_product_batches_id_fk" FOREIGN KEY ("product_batch_id") REFERENCES "public"."product_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_source_batch_id_production_batches_id_fk" FOREIGN KEY ("source_batch_id") REFERENCES "public"."production_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_source_recipe_id_recipes_id_fk" FOREIGN KEY ("source_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumptions" ADD CONSTRAINT "production_consumptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_child_recipe_id_recipes_id_fk" FOREIGN KEY ("child_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_source_batch_id_product_batches_id_fk" FOREIGN KEY ("source_batch_id") REFERENCES "public"."product_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_product_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_transfer_id_stock_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_source_batch_id_product_batches_id_fk" FOREIGN KEY ("source_batch_id") REFERENCES "public"."product_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destination_batch_id_product_batches_id_fk" FOREIGN KEY ("destination_batch_id") REFERENCES "public"."product_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_products_to_categories" ADD CONSTRAINT "website_products_to_categories_product_id_website_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."website_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_products_to_categories" ADD CONSTRAINT "website_products_to_categories_category_id_website_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."website_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_products_to_subcategories" ADD CONSTRAINT "website_products_to_subcategories_product_id_website_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."website_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_products_to_subcategories" ADD CONSTRAINT "website_products_to_subcategories_subcategory_id_website_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."website_subcategories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_subcategories" ADD CONSTRAINT "website_subcategories_category_id_website_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."website_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_user_idx" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_log_action_idx" ON "activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "activity_log_entity_idx" ON "activity_log" USING btree ("entity");--> statement-breakpoint
CREATE INDEX "activity_log_entity_id_idx" ON "activity_log" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_log_location_idx" ON "activity_log" USING btree ("location");--> statement-breakpoint
CREATE INDEX "activity_log_entity_lookup_idx" ON "activity_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "production_batches_recipe_idx" ON "production_batches" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "production_batches_produced_at_idx" ON "production_batches" USING btree ("produced_at");--> statement-breakpoint
CREATE INDEX "production_batches_location_idx" ON "production_batches" USING btree ("location");--> statement-breakpoint
CREATE INDEX "production_batches_fifo_idx" ON "production_batches" USING btree ("recipe_id","location","produced_at");--> statement-breakpoint
CREATE INDEX "prod_cons_target_idx" ON "production_consumptions" USING btree ("target_batch_id");--> statement-breakpoint
CREATE INDEX "prod_cons_prod_batch_idx" ON "production_consumptions" USING btree ("product_batch_id");--> statement-breakpoint
CREATE INDEX "prod_cons_source_batch_idx" ON "production_consumptions" USING btree ("source_batch_id");--> statement-breakpoint
CREATE INDEX "prod_cons_product_idx" ON "production_consumptions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "prod_cons_source_recipe_idx" ON "production_consumptions" USING btree ("source_recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_items_recipe_idx" ON "recipe_items" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_items_product_idx" ON "recipe_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "recipe_items_child_recipe_idx" ON "recipe_items" USING btree ("child_recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_unique_product" ON "recipe_items" USING btree ("recipe_id","product_id") WHERE "recipe_items"."ref_type" = 'product';--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_items_unique_recipe" ON "recipe_items" USING btree ("recipe_id","child_recipe_id") WHERE "recipe_items"."ref_type" = 'recipe';--> statement-breakpoint
CREATE INDEX "recipes_type_idx" ON "recipes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "recipes_name_idx" ON "recipes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "products_location_idx" ON "products" USING btree ("location");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_batches_product_idx" ON "product_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_batches_location_idx" ON "product_batches" USING btree ("location");--> statement-breakpoint
CREATE INDEX "product_batches_received_at_idx" ON "product_batches" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "product_batches_fifo_idx" ON "product_batches" USING btree ("product_id","location","received_at");--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movements_location_idx" ON "stock_movements" USING btree ("location");--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_transfer_idx" ON "stock_movements" USING btree ("transfer_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_product_idx" ON "stock_transfers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_from_idx" ON "stock_transfers" USING btree ("from_location");--> statement-breakpoint
CREATE INDEX "stock_transfers_to_idx" ON "stock_transfers" USING btree ("to_location");--> statement-breakpoint
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stock_transfers_created_at_idx" ON "stock_transfers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_balances_location_idx" ON "stock_balances" USING btree ("location");--> statement-breakpoint
CREATE INDEX "stock_balances_total_amount_idx" ON "stock_balances" USING btree ("total_amount");--> statement-breakpoint
CREATE INDEX "website_products_sort_order_idx" ON "website_products" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "website_products_is_new_idx" ON "website_products" USING btree ("is_new_product");--> statement-breakpoint
CREATE INDEX "ptc_category_id_idx" ON "website_products_to_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "pts_subcategory_id_idx" ON "website_products_to_subcategories" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "subcategories_category_id_idx" ON "website_subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "subcategories_slug_idx" ON "website_subcategories" USING btree ("slug");