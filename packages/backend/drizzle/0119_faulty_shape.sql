CREATE TABLE `autokick_bypass` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	CONSTRAINT `pk_guild_user` PRIMARY KEY(`guild`,`user`)
);
