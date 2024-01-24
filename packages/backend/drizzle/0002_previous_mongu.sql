CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`code` varchar(64) NOT NULL,
	`title` varchar(64) NOT NULL,
	`subtitle` varchar(64) NOT NULL,
	`summary` varchar(256) NOT NULL,
	`body` text NOT NULL,
	CONSTRAINT `news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `users`;