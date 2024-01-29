DROP INDEX `idx_stripe` ON `customers`;--> statement-breakpoint
ALTER TABLE `customers` ADD PRIMARY KEY(`stripe`);--> statement-breakpoint
ALTER TABLE `customers` DROP INDEX `customers_discord_unique`;--> statement-breakpoint
ALTER TABLE `customers` DROP INDEX `customers_stripe_unique`;