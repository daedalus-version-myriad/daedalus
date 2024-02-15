CREATE TABLE `suggestion_votes` (
	`message` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`yes` boolean NOT NULL,
	CONSTRAINT `pk_message_user` PRIMARY KEY(`message`,`user`)
);
--> statement-breakpoint
CREATE INDEX `idx_yes` ON `suggestion_votes` (`yes`);