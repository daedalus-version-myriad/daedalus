ALTER TABLE `guild_logging_settings_items` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `guild_logging_settings_items` ADD PRIMARY KEY(`guild`,`key`);