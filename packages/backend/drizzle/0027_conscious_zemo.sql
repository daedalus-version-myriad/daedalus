CREATE TABLE `guild_reaction_roles_items` (
	`guild` varchar(20) NOT NULL,
	`id` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`add_to_existing` boolean NOT NULL,
	`channel` varchar(20),
	`message` varchar(20),
	`url` varchar(128) NOT NULL,
	`style` enum('dropdown','buttons','reactions') NOT NULL,
	`type` enum('normal','unique','verify','lock') NOT NULL,
	`dropdown_data` json NOT NULL,
	`button_data` json NOT NULL,
	`reaction_data` json NOT NULL,
	`prompt_message` json NOT NULL,
	`error` text,
	CONSTRAINT `unq_guild_id` UNIQUE(`guild`,`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `guild_supporter_announcements_items` (`guild`);