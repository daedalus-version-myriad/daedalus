CREATE TABLE `reminder_ids` (
	`user` varchar(20) NOT NULL,
	`id` int NOT NULL,
	CONSTRAINT `reminder_ids_user` PRIMARY KEY(`user`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int NOT NULL,
	`guild` varchar(20),
	`user` varchar(20) NOT NULL,
	`time` bigint NOT NULL,
	`query` varchar(1024),
	`origin` varchar(128),
	CONSTRAINT `pk_guild_id` PRIMARY KEY(`user`,`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `reminders` (`guild`);--> statement-breakpoint
CREATE INDEX `idx_time` ON `reminders` (`time`);