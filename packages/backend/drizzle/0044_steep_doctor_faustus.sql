CREATE TABLE `guild_autoresponder_items` (
	`guild` varchar(20) NOT NULL,
	`enabled` boolean NOT NULL,
	`match` varchar(4000) NOT NULL,
	`wildcard` boolean NOT NULL,
	`case_insensitive` boolean NOT NULL,
	`respond_to_bots_and_webhooks` boolean NOT NULL,
	`reply_mode` enum('none','normal','reply','ping-reply') NOT NULL,
	`reaction` varchar(20),
	`message` json NOT NULL,
	`parsed` json NOT NULL,
	`bypass_default_channel_settings` boolean NOT NULL,
	`bypass_default_role_settings` boolean NOT NULL,
	`only_in_allowed_channels` boolean NOT NULL,
	`only_in_allowed_roles` boolean NOT NULL,
	`allowed_channels` text NOT NULL,
	`allowed_roles` text NOT NULL,
	`blocked_channels` text NOT NULL,
	`blocked_roles` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guild_autoresponder_settings` (
	`guild` varchar(20) NOT NULL,
	`only_in_allowed_channels` boolean NOT NULL,
	`only_to_allowed_roles` boolean NOT NULL,
	`allowed_channels` text NOT NULL,
	`allowed_roles` text NOT NULL,
	`blocked_channels` text NOT NULL,
	`blocked_roles` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `guild_autoresponder_items` (`guild`);