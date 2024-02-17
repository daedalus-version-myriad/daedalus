CREATE TABLE `sticky_messages` (
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`message` varchar(20),
	`content` varchar(4000) NOT NULL,
	`seconds` int NOT NULL,
	CONSTRAINT `sticky_messages_channel` PRIMARY KEY(`channel`)
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `sticky_messages` (`guild`);