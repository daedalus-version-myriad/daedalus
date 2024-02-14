CREATE TABLE `ticket_messages` (
	`uuid` varchar(36) NOT NULL,
	`type` enum('open','message','close'),
	`id` varchar(20),
	`author` varchar(20) NOT NULL,
	`content` varchar(4000) NOT NULL,
	`attachments` json NOT NULL,
	`edits` json NOT NULL,
	`deleted` boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`uuid` varchar(36) NOT NULL,
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`prompt` bigint NOT NULL,
	`target` bigint NOT NULL,
	`closed` boolean NOT NULL,
	`channel` varchar(20) NOT NULL,
	CONSTRAINT `tickets_uuid` PRIMARY KEY(`uuid`)
);
--> statement-breakpoint
CREATE INDEX `idx_uuid` ON `ticket_messages` (`uuid`);--> statement-breakpoint
CREATE INDEX `idx_guild_user_prompt_target` ON `tickets` (`guild`,`user`,`prompt`,`target`);