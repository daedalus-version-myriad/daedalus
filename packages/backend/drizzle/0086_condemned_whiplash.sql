CREATE TABLE `giveaway_entries` (
	`guild` varchar(20) NOT NULL,
	`id` int NOT NULL,
	`user` varchar(20) NOT NULL,
	CONSTRAINT `pk_guild_id_user` PRIMARY KEY(`guild`,`id`,`user`)
);
--> statement-breakpoint
CREATE INDEX `idx_closed` ON `guild_giveaway_items` (`closed`);