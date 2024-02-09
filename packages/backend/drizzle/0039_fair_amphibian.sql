CREATE TABLE `guild_sticky_roles_settings` (
	`guild` varchar(20) NOT NULL,
	`roles` text NOT NULL,
	CONSTRAINT `guild_sticky_roles_settings_guild` PRIMARY KEY(`guild`)
);
--> statement-breakpoint
CREATE TABLE `sticky_roles` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`roles` text NOT NULL,
	CONSTRAINT `pk_guild_user` PRIMARY KEY(`guild`,`user`)
);
