CREATE TABLE `notes` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`notes` varchar(4096) NOT NULL,
	CONSTRAINT `pk_guild_user` PRIMARY KEY(`guild`,`user`)
);
