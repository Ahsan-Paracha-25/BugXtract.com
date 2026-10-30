CREATE TABLE `customer_profiles` (
	`lead_id` text PRIMARY KEY NOT NULL,
	`engagement_status` text DEFAULT 'Active' NOT NULL,
	`started_at` text DEFAULT '' NOT NULL,
	`delivery_notes` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
