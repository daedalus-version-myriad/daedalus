CREATE TABLE `guild_logging_settings` (
	`guild` varchar(20) NOT NULL,
	`use_webhook` boolean NOT NULL,
	`channel` varchar(20),
	`webhook` varchar(128) NOT NULL,
	`ignored_channels` text NOT NULL,
	`file_only_mode` boolean NOT NULL,
	CONSTRAINT `guild_logging_settings_guild` PRIMARY KEY(`guild`)
);
--> statement-breakpoint
CREATE TABLE `guild_logging_settings_items` (
	`guild` varchar(20) NOT NULL,
	`key` varchar(32) NOT NULL,
	`enabled` boolean NOT NULL,
	`use_webhook` boolean NOT NULL,
	`channel` varchar(20),
	`webhook` varchar(128) NOT NULL,
	CONSTRAINT `guild_logging_settings_items_guild` PRIMARY KEY(`guild`)
);
