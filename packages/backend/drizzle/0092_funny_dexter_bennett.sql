CREATE TABLE `history_ids` (
	`guild` varchar(20) NOT NULL,
	`id` int NOT NULL,
	CONSTRAINT `history_ids_guild` PRIMARY KEY(`guild`)
);
--> statement-breakpoint
DROP TABLE `user_history`;