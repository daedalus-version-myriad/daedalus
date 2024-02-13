CREATE TABLE `modmail_threads` (
	`uuid` varchar(36) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`target_id` int NOT NULL,
	`closed` boolean NOT NULL,
	CONSTRAINT `modmail_threads_channel` PRIMARY KEY(`channel`),
	CONSTRAINT `unq_uuid` UNIQUE(`uuid`),
	CONSTRAINT `unq_guild_user_target` UNIQUE(`guild`,`user`,`target_id`)
);
