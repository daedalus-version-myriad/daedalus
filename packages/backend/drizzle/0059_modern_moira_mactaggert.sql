DROP INDEX `idx_channel_user` ON `modmail_notifications`;--> statement-breakpoint
ALTER TABLE `modmail_notifications` ADD PRIMARY KEY(`channel`,`user`);