CREATE TABLE `user_history` (
	`id` int NOT NULL,
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`type` enum('ban','kick','timeout','mute','informal_warn','warn','bulk') NOT NULL,
	`mod` varchar(20) NOT NULL,
	`time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`duration` int,
	`origin` varchar(128),
	`reason` varchar(512),
	CONSTRAINT `pk_guild_id` PRIMARY KEY(`guild`,`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_guild_user` ON `user_history` (`guild`,`user`);