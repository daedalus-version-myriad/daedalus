CREATE TABLE `guild_giveaway_items` (
	`guild` varchar(20) NOT NULL,
	`id` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`channel` varchar(20),
	`message` json NOT NULL,
	`required_roles` text NOT NULL,
	`required_roles_all` boolean NOT NULL,
	`blocked_roles` text NOT NULL,
	`blocked_roles_all` boolean NOT NULL,
	`bypass_roles` text NOT NULL,
	`bypass_roles_all` boolean NOT NULL,
	`stack_weights` boolean NOT NULL,
	`weights` text NOT NULL,
	`winners` int NOT NULL,
	`allow_repeat_winners` boolean NOT NULL,
	`deadline` bigint NOT NULL,
	`message_id` varchar(20),
	`error` text,
	`closed` boolean NOT NULL,
	CONSTRAINT `pk_guild_id` PRIMARY KEY(`guild`,`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_message` ON `guild_giveaway_items` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_deadline` ON `guild_giveaway_items` (`deadline`);