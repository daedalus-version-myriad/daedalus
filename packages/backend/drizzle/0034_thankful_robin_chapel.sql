CREATE TABLE `guild_automod_items` (
	`guild` varchar(20) NOT NULL,
	`enable` boolean NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('blocked-terms','blocked-stickers','caps-spam','newline-spam','repeated-characters','length-limit','emoji-spam','ratelimit','attachment-spam','sticker-spam','link-spam','invite-links','link-blocklist','mention-spam') NOT NULL,
	`blocked_terms_data` json NOT NULL,
	`blocked_stickers_data` json NOT NULL,
	`caps_spam_data` json NOT NULL,
	`newline_spam_data` json NOT NULL,
	`repeated_characters_data` json NOT NULL,
	`length_limit_data` json NOT NULL,
	`emoji_spam_data` json NOT NULL,
	`ratelimit_data` json NOT NULL,
	`attachment_spam_data` json NOT NULL,
	`sticker_spam_data` json NOT NULL,
	`link_spam_data` json NOT NULL,
	`invite_links_data` json NOT NULL,
	`link_blocklist_data` json NOT NULL,
	`mention_spam_data` json NOT NULL,
	`report_to_channel` boolean NOT NULL,
	`delete_message` boolean NOT NULL,
	`notify_author` boolean NOT NULL,
	`report_channel` varchar(20),
	`additional_action` enum('nothing','warn','mute','timeout','kick','ban') NOT NULL,
	`action_duration` int NOT NULL,
	`disregard_default_ignored_channels` boolean NOT NULL,
	`disregard_default_ignored_roles` boolean NOT NULL,
	`only_watch_enabled_channels` boolean NOT NULL,
	`only_watch_enabled_roles` boolean NOT NULL,
	`ignored_channels` json NOT NULL,
	`ignored_roles` json NOT NULL,
	`watched_channels` json NOT NULL,
	`watched_roles` json NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guild_automod_settings` (
	`guild` varchar(20) NOT NULL,
	`ignored_channels` json NOT NULL,
	`ignored_roles` json NOT NULL,
	`default_channel` varchar(20),
	`interact_with_webhooks` boolean NOT NULL,
	CONSTRAINT `guild_automod_settings_guild` PRIMARY KEY(`guild`)
);
--> statement-breakpoint
CREATE INDEX `idx_guild` ON `guild_automod_items` (`guild`);