CREATE TABLE `guild_reddit_feeds_items` (
	`guild` varchar(20) NOT NULL,
	`subreddit` varchar(32) NOT NULL,
	`channel` varchar(20)
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `guild_reddit_feeds_items` (`guild`);