CREATE TABLE `xp_amounts` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`text_daily` float NOT NULL,
	`text_weekly` float NOT NULL,
	`text_monthly` float NOT NULL,
	`text_total` float NOT NULL,
	`voice_daily` float NOT NULL,
	`voice_weekly` float NOT NULL,
	`voice_monthly` float NOT NULL,
	`voice_total` float NOT NULL,
	CONSTRAINT `pk_guild_user` PRIMARY KEY(`guild`,`user`)
);
