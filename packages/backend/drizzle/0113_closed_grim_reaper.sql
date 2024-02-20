DROP INDEX `idx_deadline` ON `guild_giveaway_items`;--> statement-breakpoint
DROP INDEX `idx_closed` ON `guild_giveaway_items`;--> statement-breakpoint
CREATE INDEX `idx_deadline_closed` ON `guild_giveaway_items` (`deadline`);--> statement-breakpoint
CREATE INDEX `idx_uuid_source` ON `modmail_messages` (`uuid`,`source`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `modmail_threads` (`user`);