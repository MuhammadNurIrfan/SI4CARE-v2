CREATE TABLE `batches` (
	`id` varchar(36) NOT NULL,
	`variant_id` varchar(36) NOT NULL,
	`batch_number` varchar(100),
	`hpp` decimal(15,2) NOT NULL,
	`quantity` int NOT NULL,
	`remaining` int NOT NULL,
	`expired_date` date,
	`supplier` varchar(255),
	`received_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`image_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`category_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`brand` varchar(100),
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variants` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`barcode` varchar(100),
	`attributes` json,
	`active_price` decimal(15,2) NOT NULL,
	`min_stock` int NOT NULL DEFAULT 5,
	`stock_mode` enum('fifo','fefo') NOT NULL DEFAULT 'fifo',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
ALTER TABLE `batches` ADD CONSTRAINT `batches_variant_id_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variants` ADD CONSTRAINT `variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;