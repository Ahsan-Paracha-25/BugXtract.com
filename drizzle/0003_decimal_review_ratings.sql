PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customer_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`role` text NOT NULL,
	`company` text NOT NULL,
	`headline` text NOT NULL,
	`body` text NOT NULL,
	`rating` real NOT NULL,
	`image_key` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_customer_reviews`("id", "customer_name", "role", "company", "headline", "body", "rating", "image_key", "published", "created_at", "updated_at") SELECT "id", "customer_name", "role", "company", "headline", "body", "rating", "image_key", "published", "created_at", "updated_at" FROM `customer_reviews`;--> statement-breakpoint
DROP TABLE `customer_reviews`;--> statement-breakpoint
ALTER TABLE `__new_customer_reviews` RENAME TO `customer_reviews`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_customer_reviews_published_updated` ON `customer_reviews` (`published`,`updated_at`);