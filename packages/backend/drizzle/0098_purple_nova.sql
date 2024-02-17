CREATE TABLE `highlights` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`phrases` json NOT NULL,
	`replies` boolean NOT NULL,
	`cooldown` int NOT NULL,
	`delay` int NOT NULL,
	`blocked_channels` text NOT NULL,
	`blocked_users` text NOT NULL,
	CONSTRAINT `pk_guild_user` PRIMARY KEY(`guild`,`user`)
);
