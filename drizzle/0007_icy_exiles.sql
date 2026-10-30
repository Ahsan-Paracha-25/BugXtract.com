CREATE TABLE `contact_lead_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`kind` text NOT NULL,
	`detail` text NOT NULL,
	`author` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_contact_lead_activity_lead_created` ON `contact_lead_activity` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `contact_lead_metadata` (
	`lead_id` text PRIMARY KEY NOT NULL,
	`lead_type` text DEFAULT 'Prospect' NOT NULL,
	`follow_up_at` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_lead_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`note` text NOT NULL,
	`author` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_contact_lead_notes_lead_created` ON `contact_lead_notes` (`lead_id`,`created_at`);