CREATE TABLE `moderation_removal_tasks` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`action` enum('unmute','unban') NOT NULL,
	`time` timestamp NOT NULL,
	CONSTRAINT `pk_guild_user_action` PRIMARY KEY(`guild`,`user`,`action`)
);
--> statement-breakpoint
CREATE TABLE `user_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`type` enum('ban','kick','timeout','mute','informal_warn','warn','bulk') NOT NULL,
	`mod` varchar(20) NOT NULL,
	`time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`duration` int,
	`origin` varchar(128),
	`reason` varchar(512),
	CONSTRAINT `user_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_guild_user` ON `user_history` (`guild`,`user`);