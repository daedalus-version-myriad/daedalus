CREATE TABLE `modmail_messages` (
	`uuid` varchar(36),
	`time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`type` enum('open','incoming','internal','outgoing','close'),
	`id` varchar(20) NOT NULL,
	`source` int NOT NULL,
	`target` varchar(20) NOT NULL,
	`author` varchar(20) NOT NULL,
	`anon` boolean NOT NULL,
	`target_name` varchar(100) NOT NULL,
	`content` varchar(4000) NOT NULL,
	`edits` text NOT NULL,
	`attachments` json NOT NULL,
	`deleted` boolean NOT NULL,
	`sent` boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE `modmail_threads` (
	`uuid` varchar(36) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`target_id` varchar(20) NOT NULL,
	`closed` boolean NOT NULL,
	CONSTRAINT `modmail_threads_channel` PRIMARY KEY(`channel`),
	CONSTRAINT `unq_uuid` UNIQUE(`uuid`)
);
