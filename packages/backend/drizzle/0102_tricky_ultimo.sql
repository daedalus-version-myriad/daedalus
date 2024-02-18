CREATE TABLE `guild_autokick_settings` (
	`guild` varchar(20) NOT NULL,
	`minimum_age` int NOT NULL,
	CONSTRAINT `guild_autokick_settings_guild` PRIMARY KEY(`guild`)
);
