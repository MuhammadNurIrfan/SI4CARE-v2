CREATE TABLE `cart_items` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`variant_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL,
	`added_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_cart_user_variant` UNIQUE(`user_id`,`variant_id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`variant_id` varchar(36),
	`product_name` varchar(255) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(15,2) NOT NULL,
	`batch_allocations` json,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`status` enum('pending_payment','paid','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending_payment',
	`snap_address` json NOT NULL,
	`courier` varchar(50),
	`courier_service` varchar(50),
	`shipping_cost` decimal(15,2) NOT NULL,
	`subtotal` decimal(15,2) NOT NULL,
	`discount_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`ppn` decimal(15,2) NOT NULL DEFAULT '0',
	`service_fee` decimal(15,2) NOT NULL DEFAULT '4500',
	`total_amount` decimal(15,2) NOT NULL,
	`voucher_id` varchar(36),
	`midtrans_order_id` varchar(100),
	`midtrans_token` varchar(500),
	`payment_method` varchar(50),
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_midtrans_order_id_unique` UNIQUE(`midtrans_order_id`)
);
--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('percent','fixed') NOT NULL,
	`value` decimal(15,2) NOT NULL,
	`min_order` decimal(15,2),
	`max_discount` decimal(15,2),
	`usage_limit` int,
	`used_count` int NOT NULL DEFAULT 0,
	`valid_from` timestamp NOT NULL,
	`valid_until` timestamp NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vouchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `vouchers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_variant_id_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_voucher_id_vouchers_id_fk` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE set null ON UPDATE no action;