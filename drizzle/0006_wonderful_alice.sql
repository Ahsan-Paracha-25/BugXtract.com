CREATE TABLE `contact_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`service` text NOT NULL,
	`plan` text NOT NULL,
	`timeline` text DEFAULT '' NOT NULL,
	`budget` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_contact_leads_created_at` ON `contact_leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_contact_leads_status_created_at` ON `contact_leads` (`status`,`created_at`);