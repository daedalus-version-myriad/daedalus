CREATE TABLE `modmail_autoclose` (
	`channel` varchar(20) NOT NULL,
	`guild` varchar(20) NOT NULL,
	`author` varchar(20) NOT NULL,
	`notify` boolean NOT NULL,
	`message` varchar(4000) NOT NULL,
	CONSTRAINT `modmail_autoclose_channel` PRIMARY KEY(`channel`)
);
--> statement-breakpoint
CREATE TABLE `modmail_notifications` (
	`channel` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`once` boolean NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_channel_user` ON `modmail_notifications` (`channel`,`user`);--> statement-breakpoint
CREATE INDEX `idx_once` ON `modmail_notifications` (`once`);--> statement-breakpoint
CREATE INDEX `idx_guild_user_target` ON `modmail_threads` (`guild`,`user`,`target_id`);