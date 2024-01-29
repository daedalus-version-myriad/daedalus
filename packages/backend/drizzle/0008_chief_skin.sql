CREATE TABLE `customers` (
	`discord` varchar(20) NOT NULL,
	`stripe` varchar(32) NOT NULL,
	CONSTRAINT `customers_discord_unique` UNIQUE(`discord`),
	CONSTRAINT `customers_stripe_unique` UNIQUE(`stripe`)
);
--> statement-breakpoint
CREATE TABLE `payment_links` (
	`key` varchar(256) NOT NULL,
	`links` text NOT NULL,
	CONSTRAINT `payment_links_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `premium_key_bindings` (
	`key` varchar(32) NOT NULL,
	`guild` varchar(20) NOT NULL,
	`disabled` boolean NOT NULL DEFAULT false,
	CONSTRAINT `premium_key_bindings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `premium_keys` (
	`user` varchar(20) NOT NULL,
	`key` varchar(32) NOT NULL,
	CONSTRAINT `pk_user_key` PRIMARY KEY(`user`,`key`)
);
--> statement-breakpoint
CREATE INDEX `idx_discord` ON `customers` (`discord`);--> statement-breakpoint
CREATE INDEX `idx_stripe` ON `customers` (`stripe`);