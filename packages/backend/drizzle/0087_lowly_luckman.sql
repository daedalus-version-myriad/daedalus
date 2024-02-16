CREATE TABLE `guild_reports_settings` (
	`guild` varchar(20) NOT NULL,
	`channel` varchar(20),
	`ping_roles` text NOT NULL,
	`anon` boolean NOT NULL
);
