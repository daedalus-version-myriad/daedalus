CREATE TABLE `guild_utility_settings` (
	`guild` varchar(20) NOT NULL,
	`role_command_block_by_default` boolean NOT NULL,
	`role_command_blocked_roles` text NOT NULL,
	`role_command_allowed_roles` text NOT NULL,
	`role_command_bypass_roles` text NOT NULL,
	CONSTRAINT `guild_utility_settings_guild` PRIMARY KEY(`guild`)
);
