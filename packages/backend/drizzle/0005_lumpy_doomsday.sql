ALTER TABLE `guild_settings` ADD `mod_only` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `guild_settings` ADD `allowed_roles` text DEFAULT ('') NOT NULL;