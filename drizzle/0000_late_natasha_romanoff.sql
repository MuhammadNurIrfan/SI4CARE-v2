CREATE TYPE "public"."article_status" AS ENUM('draft', 'terbit', 'terjadwal');--> statement-breakpoint
CREATE TYPE "public"."chat_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."ledger_channel" AS ENUM('pos', 'web', 'marketplace');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."outbound_channel" AS ENUM('pos', 'marketplace');--> statement-breakpoint
CREATE TYPE "public"."outbound_status" AS ENUM('completed', 'pending_settlement', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('rusak', 'tidak_sesuai', 'kurang', 'expired', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('pending', 'inspeksi', 'layak_jual', 'write_off', 'ditolak');--> statement-breakpoint
CREATE TYPE "public"."stock_mode" AS ENUM('fifo', 'fefo');--> statement-breakpoint
CREATE TYPE "public"."stock_opname_status" AS ENUM('open', 'selesai');--> statement-breakpoint
CREATE TYPE "public"."voucher_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"label" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) DEFAULT 'Edukasi',
	"excerpt" text,
	"body" text,
	"cover_image" varchar(500),
	"meta_title" varchar(255),
	"meta_description" text,
	"schema_type" varchar(50) DEFAULT 'Article',
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"author_id" varchar(36),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36),
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" varchar(100),
	"detail" json,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"variant_id" varchar(36) NOT NULL,
	"batch_number" varchar(100),
	"hpp" numeric(15, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"remaining" integer NOT NULL,
	"expired_date" date,
	"supplier" varchar(255),
	"received_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"address" text,
	"phone" varchar(30),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"variant_id" varchar(36) NOT NULL,
	"quantity" integer NOT NULL,
	"added_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "uq_cart_user_variant" UNIQUE("user_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"thread_id" varchar(36) NOT NULL,
	"sender_id" varchar(36) NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"customer_id" varchar(36) NOT NULL,
	"status" "chat_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_sections" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"data" json NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"branch_id" varchar(36) DEFAULT 'main' NOT NULL,
	"entry_date" date NOT NULL,
	"channel" "ledger_channel" NOT NULL,
	"reference_id" varchar(36) NOT NULL,
	"ref_number" varchar(100) NOT NULL,
	"total_sales" numeric(15, 2) NOT NULL,
	"total_hpp" numeric(15, 2) NOT NULL,
	"gross_margin" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"order_id" varchar(36) NOT NULL,
	"variant_id" varchar(36),
	"product_name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"batch_allocations" json
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"branch_id" varchar(36) DEFAULT 'main' NOT NULL,
	"user_id" varchar(36),
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"snap_address" json NOT NULL,
	"courier" varchar(50),
	"courier_service" varchar(50),
	"shipping_cost" numeric(15, 2) NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"ppn" numeric(15, 2) DEFAULT '0' NOT NULL,
	"service_fee" numeric(15, 2) DEFAULT '4500' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"voucher_id" varchar(36),
	"midtrans_order_id" varchar(100),
	"midtrans_token" varchar(500),
	"payment_method" varchar(50),
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "orders_midtrans_order_id_unique" UNIQUE("midtrans_order_id")
);
--> statement-breakpoint
CREATE TABLE "outbound_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"transaction_id" varchar(36) NOT NULL,
	"variant_id" varchar(36),
	"product_name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"unit_hpp" numeric(15, 2) NOT NULL,
	"item_discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"batch_allocations" json
);
--> statement-breakpoint
CREATE TABLE "outbound_transactions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"branch_id" varchar(36) DEFAULT 'main' NOT NULL,
	"channel" "outbound_channel" NOT NULL,
	"ref_number" varchar(100) NOT NULL,
	"platform" varchar(50),
	"platform_order_id" varchar(100),
	"customer_name" varchar(255),
	"payment_method" varchar(50),
	"cash_received" numeric(15, 2),
	"subtotal" numeric(15, 2) NOT NULL,
	"item_discount_total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"cart_discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_discount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"dpp" numeric(15, 2) DEFAULT '0' NOT NULL,
	"ppn" numeric(15, 2) DEFAULT '0' NOT NULL,
	"mdr_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"net_amount" numeric(15, 2) NOT NULL,
	"total_hpp" numeric(15, 2) NOT NULL,
	"marketplace_fees" json,
	"status" "outbound_status" DEFAULT 'completed' NOT NULL,
	"settled_at" timestamp,
	"settled_amount" numeric(15, 2),
	"notes" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" varchar(36)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"category_id" varchar(36),
	"name" varchar(255) NOT NULL,
	"brand" varchar(100),
	"description" text,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"order_id" varchar(36),
	"user_id" varchar(36),
	"reason" "return_reason" NOT NULL,
	"detail" text,
	"photos" json,
	"status" "return_status" DEFAULT 'pending' NOT NULL,
	"inspection_notes" text,
	"admin_id" varchar(36),
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_opname_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"session_id" varchar(36) NOT NULL,
	"variant_id" varchar(36),
	"product_name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"lokasi" varchar(100),
	"system_stock" integer DEFAULT 0 NOT NULL,
	"physical_stock" integer,
	"adjustment_delta" integer,
	"hpp" numeric(15, 2) DEFAULT '0' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "stock_opname_sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"session_no" varchar(50) NOT NULL,
	"branch_id" varchar(36) DEFAULT 'main' NOT NULL,
	"conducted_by" varchar(36),
	"status" "stock_opname_status" DEFAULT 'open' NOT NULL,
	"notes" text,
	"conducted_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "stock_opname_sessions_session_no_unique" UNIQUE("session_no")
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"attributes" json,
	"active_price" numeric(15, 2) NOT NULL,
	"min_stock" integer DEFAULT 5 NOT NULL,
	"stock_mode" "stock_mode" DEFAULT 'fifo' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" "voucher_type" NOT NULL,
	"value" numeric(15, 2) NOT NULL,
	"min_order" numeric(15, 2),
	"max_discount" numeric(15, 2),
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp (3),
	"refresh_token_expires_at" timestamp (3),
	"scope" text,
	"password" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" varchar(36) NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"role" text DEFAULT 'customer',
	"phone" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_customer_id_user_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_items" ADD CONSTRAINT "outbound_items_transaction_id_outbound_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."outbound_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_items" ADD CONSTRAINT "outbound_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_transactions" ADD CONSTRAINT "outbound_transactions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_session_id_stock_opname_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stock_opname_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opname_sessions" ADD CONSTRAINT "stock_opname_sessions_conducted_by_user_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");