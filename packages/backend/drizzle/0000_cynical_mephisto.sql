CREATE TABLE `admins` (
	`id` varchar(20) NOT NULL,
	CONSTRAINT `admins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`code` varchar(64) NOT NULL,
	`date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`title` varchar(64) NOT NULL,
	`subtitle` varchar(64) NOT NULL,
	`summary` varchar(256) NOT NULL,
	`body` text NOT NULL,
	CONSTRAINT `news_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE INDEX `idx_date` ON `news` (`date`);