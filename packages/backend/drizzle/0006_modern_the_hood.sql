ALTER TABLE `guild_settings` ADD `allowlist_only` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `guild_settings` ADD `allowed_channels` text DEFAULT ('') NOT NULL;--> statement-breakpoint
ALTER TABLE `guild_settings` ADD `blocked_channels` text DEFAULT ('') NOT NULL;