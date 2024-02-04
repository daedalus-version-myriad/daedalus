CREATE TABLE `guild_xp_settings` (
	`guild` varchar(20) NOT NULL,
	`blocked_channels` text NOT NULL,
	`blocked_roles` text NOT NULL,
	`bonus_channels` text NOT NULL,
	`bonus_roles` text NOT NULL,
	`rank_card_background` varchar(1024) NOT NULL,
	`announce_level_up` boolean NOT NULL,
	`announce_in_channel` boolean NOT NULL,
	`announce_channel` varchar(20),
	`announcement_background` varchar(1024) NOT NULL,
	`rewards` text NOT NULL,
	CONSTRAINT `guild_xp_settings_guild` PRIMARY KEY(`guild`)
);
