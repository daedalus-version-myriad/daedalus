CREATE TABLE `sticky_roles` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`role` varchar(20) NOT NULL,
	CONSTRAINT `pk_guild_user_role` PRIMARY KEY(`guild`,`user`,`role`)
);
