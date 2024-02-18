CREATE TABLE `audit_logs` (
	`guild` varchar(20) NOT NULL,
	`user` varchar(20) NOT NULL,
	`module` varchar(32) NOT NULL,
	`data` json NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_guild_module` ON `audit_logs` (`guild`,`module`);