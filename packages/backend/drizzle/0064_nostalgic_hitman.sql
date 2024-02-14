CREATE TABLE `guild_tickets_items` (
	`guild` varchar(20) NOT NULL,
	`id` bigint NOT NULL,
	`name` varchar(128) NOT NULL,
	`channel` varchar(20),
	`message` varchar(20),
	`prompt` json NOT NULL,
	`use_multi` boolean NOT NULL,
	`error` text,
	CONSTRAINT `unq_guild_id` UNIQUE(`guild`,`id`)
);
--> statement-breakpoint
CREATE TABLE `guild_tickets_targets` (
	`id` bigint NOT NULL,
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20),
	`category` varchar(20),
	`button_label` varchar(80) NOT NULL,
	`button_color` enum('gray','blue','green','red') NOT NULL,
	`dropdown_label` varchar(100) NOT NULL,
	`dropdown_description` varchar(100) NOT NULL,
	`emoji` varchar(20),
	`ping_roles` text NOT NULL,
	`ping_here` boolean NOT NULL,
	`post_custom_open_message` boolean NOT NULL,
	`custom_open_message` json NOT NULL,
	`custom_open_parsed` json NOT NULL,
	CONSTRAINT `unq_guild_id` UNIQUE(`guild`,`id`)
);
