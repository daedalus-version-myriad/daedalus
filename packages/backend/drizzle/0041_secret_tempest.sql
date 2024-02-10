CREATE TABLE `guild_custom_roles_settings` (
	`guild` varchar(20) NOT NULL,
	`allow_boosters` boolean NOT NULL,
	`roles` text NOT NULL,
	`anchor` varchar(20),
	CONSTRAINT `guild_custom_roles_settings_guild` PRIMARY KEY(`guild`)
);
