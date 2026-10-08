CREATE TABLE `contact_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`recipient_email` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_submission_limits` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`submissions` integer NOT NULL,
	`window_started` integer NOT NULL
);
