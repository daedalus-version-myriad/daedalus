CREATE TABLE `guild_settings` (
	`guild` varchar(20) NOT NULL,
	`dashboard_permission` enum('owner','admin','manager') NOT NULL DEFAULT 'manager',
	CONSTRAINT `guild_settings_guild` PRIMARY KEY(`guild`)
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`guild` varchar(20) NOT NULL,
	`token` varchar(128) NOT NULL,
	CONSTRAINT `tokens_guild` PRIMARY KEY(`guild`)
);
