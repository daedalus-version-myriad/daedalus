CREATE TABLE `guild_supporter_announcements_items` (
	`guild` varchar(20) NOT NULL,
	`use_boosts` boolean NOT NULL,
	`role` varchar(20),
	`channel` varchar(20),
	`message` json NOT NULL,
	`parsed` json NOT NULL
);
