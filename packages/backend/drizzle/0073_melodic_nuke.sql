CREATE TABLE `suggestions` (
	`guild` varchar(20) NOT NULL,
	`id` int NOT NULL,
	`channel` varchar(20) NOT NULL,
	CONSTRAINT `pk_guild_id` PRIMARY KEY(`guild`,`id`)
);
