CREATE TABLE `guild_suggestions_settings` (
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20),
	`anon` boolean NOT NULL,
	CONSTRAINT `guild_suggestions_settings_guild` PRIMARY KEY(`guild`)
);
