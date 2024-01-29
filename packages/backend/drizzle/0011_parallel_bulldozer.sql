CREATE TABLE `guild_premium_settings` (
	`guild` varchar(20) NOT NULL,
	`status` enum('online','idle','dnd','offline') NOT NULL DEFAULT 'online',
	`activity_type` enum('none','playing','listening-to','watching','competing-in') NOT NULL DEFAULT 'watching',
	`activity` varchar(64) NOT NULL DEFAULT 'for /help',
	CONSTRAINT `guild_premium_settings_guild` PRIMARY KEY(`guild`)
);
