CREATE TABLE `guild_commands_settings` (
	`guild` varchar(20) NOT NULL,
	`command` varchar(32) NOT NULL,
	`enabled` boolean NOT NULL,
	`ignore_default_permissions` boolean NOT NULL,
	`allowed_roles` text NOT NULL,
	`blocked_roles` text NOT NULL,
	`restrict_channels` boolean NOT NULL,
	`allowed_channels` text NOT NULL,
	`blocked_channels` text NOT NULL,
	CONSTRAINT `pk_guild_command` PRIMARY KEY(`guild`,`command`)
);
--> statement-breakpoint
CREATE TABLE `guild_modules_settings` (
	`guild` varchar(20) NOT NULL,
	`module` varchar(32) NOT NULL,
	`enabled` boolean NOT NULL,
	CONSTRAINT `pk_guild_module` PRIMARY KEY(`guild`,`module`)
);
