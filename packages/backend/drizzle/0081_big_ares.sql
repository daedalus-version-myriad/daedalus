CREATE TABLE `count_last` (
	`id` int NOT NULL,
	`last` varchar(20),
	CONSTRAINT `count_last_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `count_scoreboard` (
	`id` int NOT NULL,
	`user` varchar(20) NOT NULL,
	`score` int NOT NULL,
	CONSTRAINT `pk_id_user` PRIMARY KEY(`id`,`user`)
);
--> statement-breakpoint
CREATE INDEX `idx_score` ON `count_scoreboard` (`score`);