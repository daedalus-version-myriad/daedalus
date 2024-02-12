CREATE TABLE `files` (
	`uuid` varchar(36) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`message` varchar(20) NOT NULL,
	CONSTRAINT `files_uuid` PRIMARY KEY(`uuid`)
);
--> statement-breakpoint
ALTER TABLE `modmail_messages` MODIFY COLUMN `uuid` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `modmail_threads` MODIFY COLUMN `target_id` int NOT NULL;