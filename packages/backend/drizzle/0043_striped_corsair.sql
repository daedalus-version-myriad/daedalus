CREATE TABLE `guild_stats_channels_items` (
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`format` text NOT NULL,
	`parsed` json NOT NULL,
	CONSTRAINT `pk_guild_channel` PRIMARY KEY(`guild`,`channel`)
);
