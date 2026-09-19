CREATE TABLE `app_settings` (
	`key` varchar(100) NOT NULL,
	`value` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) DEFAULT 'Edukasi',
	`excerpt` text,
	`body` text,
	`cover_image` varchar(500),
	`meta_title` varchar(255),
	`meta_description` text,
	`schema_type` varchar(50) DEFAULT 'Article',
	`status` enum('draft','terbit','terjadwal') NOT NULL DEFAULT 'draft',
	`published_at` timestamp,
	`author_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(50),
	`entity_id` varchar(100),
	`detail` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`address` text,
	`phone` varchar(30),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` varchar(36) NOT NULL,
	`thread_id` varchar(36) NOT NULL,
	`sender_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_threads` (
	`id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chat_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_sections` (
	`key` varchar(100) NOT NULL,
	`data` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `content_sections_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36),
	`user_id` varchar(36),
	`reason` enum('rusak','tidak_sesuai','kurang','expired','lainnya') NOT NULL,
	`detail` text,
	`photos` json,
	`status` enum('pending','inspeksi','layak_jual','write_off','ditolak') NOT NULL DEFAULT 'pending',
	`inspection_notes` text,
	`admin_id` varchar(36),
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `returns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_opname_items` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`variant_id` varchar(36),
	`product_name` varchar(255) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`barcode` varchar(100),
	`lokasi` varchar(100),
	`system_stock` int NOT NULL DEFAULT 0,
	`physical_stock` int,
	`adjustment_delta` int,
	`hpp` decimal(15,2) NOT NULL DEFAULT '0',
	`notes` text,
	CONSTRAINT `stock_opname_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_opname_sessions` (
	`id` varchar(36) NOT NULL,
	`session_no` varchar(50) NOT NULL,
	`branch_id` varchar(36) NOT NULL DEFAULT 'main',
	`conducted_by` varchar(36),
	`status` enum('open','selesai') NOT NULL DEFAULT 'open',
	`notes` text,
	`conducted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`closed_at` timestamp,
	CONSTRAINT `stock_opname_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_opname_sessions_session_no_unique` UNIQUE(`session_no`)
);
--> statement-breakpoint
ALTER TABLE `addresses` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `addresses` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `batches` MODIFY COLUMN `received_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `cart_items` MODIFY COLUMN `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `cart_items` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ledger_entries` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `outbound_transactions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `variants` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `variants` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `vouchers` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `role` varchar(50) DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `phone` varchar(30);--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD `branch_id` varchar(36) DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `branch_id` varchar(36) DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE `outbound_transactions` ADD `branch_id` varchar(36) DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE `outbound_transactions` ADD `settled_amount` decimal(15,2);--> statement-breakpoint
ALTER TABLE `products` ADD `image_url` varchar(500);--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_thread_id_chat_threads_id_fk` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sender_id_user_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_threads` ADD CONSTRAINT `chat_threads_customer_id_user_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `returns` ADD CONSTRAINT `returns_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `returns` ADD CONSTRAINT `returns_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `returns` ADD CONSTRAINT `returns_admin_id_user_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_opname_items` ADD CONSTRAINT `stock_opname_items_session_id_stock_opname_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `stock_opname_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_opname_items` ADD CONSTRAINT `stock_opname_items_variant_id_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_opname_sessions` ADD CONSTRAINT `stock_opname_sessions_conducted_by_user_id_fk` FOREIGN KEY (`conducted_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;