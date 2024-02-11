CREATE TABLE `guild_modmail_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guild` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(100) NOT NULL,
	`emoji` varchar(20),
	`use_threads` boolean NOT NULL,
	`channel` varchar(20),
	`category` varchar(20),
	`ping_roles` text NOT NULL,
	`ping_here` boolean NOT NULL,
	`open_message` text NOT NULL,
	`close_message` text NOT NULL,
	`open_parsed` json NOT NULL,
	`close_parsed` json NOT NULL,
	CONSTRAINT `guild_modmail_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guild_modmail_settings` (
	`guild` varchar(20) NOT NULL,
	`use_multi` boolean NOT NULL,
	CONSTRAINT `guild_modmail_settings_guild` PRIMARY KEY(`guild`)
);
--> statement-breakpoint
CREATE TABLE `guild_modmail_snippets` (
	`guild` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`parsed` json NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `guild_modmail_items` (`guild`);--> statement-breakpoint
CREATE INDEX `idx_guild` ON `guild_modmail_snippets` (`guild`);