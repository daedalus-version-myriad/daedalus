ALTER TABLE `xp_amounts` MODIFY COLUMN `text_daily` float NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `xp_amounts` MODIFY COLUMN `text_weekly` float NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `xp_amounts` MODIFY COLUMN `text_monthly` float NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `xp_amounts` MODIFY COLUMN `text_total` float NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `xp_amounts` MODIFY COLUMN `voice_daily` float NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `xp_amounts` MODIFY COLUMN `voice_weekly` float NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `xp_amounts` MODIFY COLUMN `voice_monthly` float NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `xp_amounts` MODIFY COLUMN `voice_total` float NOT NULL DEFAULT 0;--> statement-breakpoint
CREATE INDEX `idx_text_daily` ON `xp_amounts` (`text_daily`);--> statement-breakpoint
CREATE INDEX `idx_text_weekly` ON `xp_amounts` (`text_weekly`);--> statement-breakpoint
CREATE INDEX `idx_text_monthly` ON `xp_amounts` (`text_monthly`);--> statement-breakpoint
CREATE INDEX `idx_text_total` ON `xp_amounts` (`text_total`);--> statement-breakpoint
CREATE INDEX `idx_voice_daily` ON `xp_amounts` (`voice_daily`);--> statement-breakpoint
CREATE INDEX `idx_voice_weekly` ON `xp_amounts` (`voice_weekly`);--> statement-breakpoint
CREATE INDEX `idx_voice_monthly` ON `xp_amounts` (`voice_monthly`);--> statement-breakpoint
CREATE INDEX `idx_voice_total` ON `xp_amounts` (`voice_total`);