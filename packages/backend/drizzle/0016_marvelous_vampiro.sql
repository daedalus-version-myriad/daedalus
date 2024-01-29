CREATE TABLE `account_settings` (
	`user` varchar(20) NOT NULL,
	`notify_premium_owned_servers` boolean NOT NULL DEFAULT true,
	`notify_premium_managed_servers` boolean NOT NULL DEFAULT false,
	`suppress_admin_broadcasts` boolean NOT NULL DEFAULT false,
	CONSTRAINT `account_settings_user` PRIMARY KEY(`user`)
);
--> statement-breakpoint
CREATE INDEX `idx_notify_owned` ON `account_settings` (`notify_premium_owned_servers`);--> statement-breakpoint
CREATE INDEX `idx_notify_managed` ON `account_settings` (`notify_premium_managed_servers`);--> statement-breakpoint
CREATE INDEX `idx_suppress_broadcasts` ON `account_settings` (`suppress_admin_broadcasts`);