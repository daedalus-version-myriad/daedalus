CREATE TABLE `guild_autoroles_settings` (
	`guild` varchar(20) NOT NULL,
	`roles` text NOT NULL,
	CONSTRAINT `guild_autoroles_settings_guild` PRIMARY KEY(`guild`)
);
