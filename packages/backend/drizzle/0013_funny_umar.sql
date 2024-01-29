ALTER TABLE `premium_keys` ADD `time` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_time` ON `premium_keys` (`time`);