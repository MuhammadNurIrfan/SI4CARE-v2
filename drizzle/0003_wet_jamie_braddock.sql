CREATE TABLE `ledger_entries` (
	`id` varchar(36) NOT NULL,
	`entry_date` date NOT NULL,
	`channel` enum('pos','web','marketplace') NOT NULL,
	`reference_id` varchar(36) NOT NULL,
	`ref_number` varchar(100) NOT NULL,
	`total_sales` decimal(15,2) NOT NULL,
	`total_hpp` decimal(15,2) NOT NULL,
	`gross_margin` decimal(15,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ledger_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outbound_items` (
	`id` varchar(36) NOT NULL,
	`transaction_id` varchar(36) NOT NULL,
	`variant_id` varchar(36),
	`product_name` varchar(255) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(15,2) NOT NULL,
	`unit_hpp` decimal(15,2) NOT NULL,
	`item_discount_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`batch_allocations` json,
	CONSTRAINT `outbound_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outbound_transactions` (
	`id` varchar(36) NOT NULL,
	`channel` enum('pos','marketplace') NOT NULL,
	`ref_number` varchar(100) NOT NULL,
	`platform` varchar(50),
	`platform_order_id` varchar(100),
	`customer_name` varchar(255),
	`payment_method` varchar(50),
	`cash_received` decimal(15,2),
	`subtotal` decimal(15,2) NOT NULL,
	`item_discount_total` decimal(15,2) NOT NULL DEFAULT '0',
	`cart_discount_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`total_discount` decimal(15,2) NOT NULL DEFAULT '0',
	`dpp` decimal(15,2) NOT NULL DEFAULT '0',
	`ppn` decimal(15,2) NOT NULL DEFAULT '0',
	`mdr_amount` decimal(15,2) NOT NULL DEFAULT '0',
	`total_amount` decimal(15,2) NOT NULL,
	`net_amount` decimal(15,2) NOT NULL,
	`total_hpp` decimal(15,2) NOT NULL,
	`marketplace_fees` json,
	`status` enum('completed','pending_settlement','cancelled') NOT NULL DEFAULT 'completed',
	`settled_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`created_by` varchar(36),
	CONSTRAINT `outbound_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `outbound_items` ADD CONSTRAINT `outbound_items_transaction_id_outbound_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `outbound_transactions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outbound_items` ADD CONSTRAINT `outbound_items_variant_id_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outbound_transactions` ADD CONSTRAINT `outbound_transactions_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;