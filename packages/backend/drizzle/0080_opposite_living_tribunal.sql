CREATE TABLE `guild_count_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`interval` int NOT NULL,
	`next` int NOT NULL,
	`allow_double_counting` boolean NOT NULL,
	CONSTRAINT `guild_count_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `guild_count_items` (`guild`);--> statement-breakpoint
CREATE INDEX `idx_channel` ON `guild_count_items` (`channel`);