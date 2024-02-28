CREATE TABLE `reddit_request_log` (
	`time` timestamp NOT NULL DEFAULT (now()),
	`success` boolean NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_time` ON `reddit_request_log` (`time`);