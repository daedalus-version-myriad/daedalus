CREATE TABLE `poll_votes` (
	`message` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`vote` text NOT NULL,
	CONSTRAINT `pk_message_user` PRIMARY KEY(`message`,`user`)
);
--> statement-breakpoint
CREATE TABLE `polls` (
	`message` varchar(20) NOT NULL,
	`type` enum('yes-no','binary','multi') NOT NULL,
	`question` varchar(1024) NOT NULL,
	`allow_neutral` boolean NOT NULL,
	`allow_multi` boolean NOT NULL,
	`left_option` varchar(80) NOT NULL,
	`right_option` varchar(80) NOT NULL,
	`options` json NOT NULL,
	CONSTRAINT `polls_message` PRIMARY KEY(`message`)
);
