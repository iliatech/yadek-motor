CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
DROP TABLE `__new_orders`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`account_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
	`province` text NOT NULL,
	`city` text NOT NULL,
	`address` text NOT NULL,
	`postal_code` text NOT NULL,
	`description` text,
	`subtotal` real NOT NULL,
	`shipping_cost` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "order_number", "account_id", "first_name", "last_name", "customer_phone", "customer_email", "province", "city", "address", "postal_code", "description", "subtotal", "shipping_cost", "total", "status", "payment_status", "created_at", "updated_at") SELECT "id", "order_number", "account_id", "first_name", "last_name", "customer_phone", "customer_email", "province", "city", "address", "postal_code", "description", "subtotal", "shipping_cost", "total", "status", "payment_status", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);