ALTER TABLE `guild_autokick_settings` ADD `send_message` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `guild_autokick_settings` ADD `message` json NOT NULL;--> statement-breakpoint
ALTER TABLE `guild_autokick_settings` ADD `parsed` json NOT NULL;