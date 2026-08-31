ALTER TABLE `modmail_messages` MODIFY COLUMN `encrypted` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `ticket_messages` MODIFY COLUMN `encrypted` boolean NOT NULL DEFAULT true;