DROP INDEX `idx_suppress_broadcasts` ON `account_settings`;--> statement-breakpoint
ALTER TABLE `account_settings` DROP COLUMN `suppress_admin_broadcasts`;