DROP INDEX `idx_time` ON `premium_keys`;--> statement-breakpoint
ALTER TABLE `premium_keys` ADD CONSTRAINT `premium_keys_key_unique` UNIQUE(`key`);--> statement-breakpoint
ALTER TABLE `premium_keys` ADD `disabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `premium_key_bindings` DROP COLUMN `disabled`;--> statement-breakpoint
ALTER TABLE `premium_keys` DROP COLUMN `time`;