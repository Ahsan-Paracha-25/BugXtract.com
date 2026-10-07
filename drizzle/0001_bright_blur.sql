CREATE TABLE `admin_auth_attempts` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`failures` integer NOT NULL,
	`window_started` integer NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_credentials` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`iterations` integer NOT NULL,
	`recovery_used` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
