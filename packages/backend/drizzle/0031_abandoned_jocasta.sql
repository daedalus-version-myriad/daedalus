CREATE TABLE `guild_starboard_overrides` (
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`enabled` boolean NOT NULL,
	`target` varchar(20),
	`threshold` int,
	CONSTRAINT `pk_guild_channel` PRIMARY KEY(`guild`,`channel`)
);
--> statement-breakpoint
CREATE TABLE `guild_starboard_settings` (
	`guild` varchar(20) NOT NULL,
	`reaction` varchar(20),
	`channel` varchar(20),
	`threshold` int NOT NULL,
	CONSTRAINT `guild_starboard_settings_guild` PRIMARY KEY(`guild`)
);
