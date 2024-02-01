CREATE TABLE `guild_welcome_settings` (
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20),
	`message` json NOT NULL,
	`parsed` json NOT NULL,
	CONSTRAINT `guild_welcome_settings_guild` PRIMARY KEY(`guild`)
);
