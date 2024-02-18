ALTER TABLE `user_history` MODIFY COLUMN `duration` bigint;--> statement-breakpoint
ALTER TABLE `limit_overrides` DROP COLUMN `vanity_client`;