CREATE TABLE `command_tracker` (
	`command` varchar(256) NOT NULL,
	`guild` varchar(20),
	`channel` varchar(20),
	`user` varchar(20) NOT NULL,
	`blocked` boolean NOT NULL,
	`time` timestamp NOT NULL DEFAULT (now()),
	`data` json
);
--> statement-breakpoint
CREATE INDEX `idx_command` ON `command_tracker` (`command`);--> statement-breakpoint
CREATE INDEX `idx_guild` ON `command_tracker` (`guild`);--> statement-breakpoint
CREATE INDEX `idx_channel` ON `command_tracker` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `command_tracker` (`user`);--> statement-breakpoint
CREATE INDEX `idx_time` ON `command_tracker` (`time`);