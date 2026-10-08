CREATE TABLE `customer_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`role` text NOT NULL,
	`company` text NOT NULL,
	`headline` text NOT NULL,
	`body` text NOT NULL,
	`rating` integer NOT NULL,
	`image_key` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customer_reviews_published_updated` ON `customer_reviews` (`published`,`updated_at`);