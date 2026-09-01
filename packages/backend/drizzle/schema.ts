import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, primaryKey, varchar, tinyint, json, timestamp, int, float, bigint, mysqlEnum, text, unique } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"


export const accountSettings = mysqlTable("account_settings", {
	user: varchar("user", { length: 20 }).notNull(),
	notifyPremiumOwnedServers: tinyint("notify_premium_owned_servers").default(1).notNull(),
	notifyPremiumManagedServers: tinyint("notify_premium_managed_servers").default(0).notNull(),
},
(table) => {
	return {
		idxNotifyOwned: index("idx_notify_owned").on(table.notifyPremiumOwnedServers),
		idxNotifyManaged: index("idx_notify_managed").on(table.notifyPremiumManagedServers),
		accountSettingsUser: primaryKey({ columns: [table.user], name: "account_settings_user"}),
	}
});

export const admins = mysqlTable("admins", {
	id: varchar("id", { length: 20 }).notNull(),
},
(table) => {
	return {
		adminsId: primaryKey({ columns: [table.id], name: "admins_id"}),
	}
});

export const auditLogs = mysqlTable("audit_logs", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	module: varchar("module", { length: 32 }).notNull(),
	data: json("data").notNull(),
},
(table) => {
	return {
		idxGuildModule: index("idx_guild_module").on(table.guild, table.module),
	}
});

export const autokickBypass = mysqlTable("autokick_bypass", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
},
(table) => {
	return {
		autokickBypassGuildUser: primaryKey({ columns: [table.guild, table.user], name: "autokick_bypass_guild_user"}),
	}
});

export const commandTracker = mysqlTable("command_tracker", {
	command: varchar("command", { length: 256 }).notNull(),
	guild: varchar("guild", { length: 20 }),
	channel: varchar("channel", { length: 20 }),
	user: varchar("user", { length: 20 }).notNull(),
	blocked: tinyint("blocked").notNull(),
	time: timestamp("time", { mode: 'string' }).defaultNow().notNull(),
	data: json("data"),
},
(table) => {
	return {
		idxCommand: index("idx_command").on(table.command),
		idxGuild: index("idx_guild").on(table.guild),
		idxChannel: index("idx_channel").on(table.channel),
		idxUser: index("idx_user").on(table.user),
		idxTime: index("idx_time").on(table.time),
	}
});

export const countLast = mysqlTable("count_last", {
	id: int("id").notNull(),
	last: varchar("last", { length: 20 }),
},
(table) => {
	return {
		countLastId: primaryKey({ columns: [table.id], name: "count_last_id"}),
	}
});

export const countScoreboard = mysqlTable("count_scoreboard", {
	id: int("id").notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	score: int("score").notNull(),
},
(table) => {
	return {
		idxScore: index("idx_score").on(table.score),
		countScoreboardIdUser: primaryKey({ columns: [table.id, table.user], name: "count_scoreboard_id_user"}),
	}
});

export const currencies = mysqlTable("currencies", {
	key: varchar("key", { length: 32 }).notNull(),
	value: float("value").notNull(),
},
(table) => {
	return {
		currenciesKey: primaryKey({ columns: [table.key], name: "currencies_key"}),
	}
});

export const customRoles = mysqlTable("custom_roles", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	role: varchar("role", { length: 20 }).notNull(),
},
(table) => {
	return {
		customRolesGuildUser: primaryKey({ columns: [table.guild, table.user], name: "custom_roles_guild_user"}),
	}
});

export const customers = mysqlTable("customers", {
	discord: varchar("discord", { length: 20 }).notNull(),
	stripe: varchar("stripe", { length: 32 }).notNull(),
},
(table) => {
	return {
		idxDiscord: index("idx_discord").on(table.discord),
		customersStripe: primaryKey({ columns: [table.stripe], name: "customers_stripe"}),
	}
});

export const files = mysqlTable("files", {
	uuid: varchar("uuid", { length: 36 }).notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
	message: varchar("message", { length: 20 }).notNull(),
},
(table) => {
	return {
		filesUuid: primaryKey({ columns: [table.uuid], name: "files_uuid"}),
	}
});

export const giveawayEntries = mysqlTable("giveaway_entries", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: int("id").notNull(),
	user: varchar("user", { length: 20 }).notNull(),
},
(table) => {
	return {
		giveawayEntriesGuildIdUser: primaryKey({ columns: [table.guild, table.id, table.user], name: "giveaway_entries_guild_id_user"}),
	}
});

export const giveawayIds = mysqlTable("giveaway_ids", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: int("id").notNull(),
},
(table) => {
	return {
		giveawayIdsGuild: primaryKey({ columns: [table.guild], name: "giveaway_ids_guild"}),
	}
});

export const globals = mysqlTable("globals", {
	id: int("id").notNull(),
	lastXpPurge: bigint("last_xp_purge", { mode: "number" }).notNull(),
},
(table) => {
	return {
		globalsId: primaryKey({ columns: [table.id], name: "globals_id"}),
	}
});

export const guildAutokickSettings = mysqlTable("guild_autokick_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	minimumAge: bigint("minimum_age", { mode: "number" }).notNull(),
	sendMessage: tinyint("send_message").notNull(),
	message: json("message").notNull(),
	parsed: json("parsed").notNull(),
},
(table) => {
	return {
		guildAutokickSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_autokick_settings_guild"}),
	}
});

export const guildAutomodItems = mysqlTable("guild_automod_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	enable: tinyint("enable").notNull(),
	name: varchar("name", { length: 128 }).notNull(),
	type: mysqlEnum("type", ['blocked-terms','blocked-stickers','caps-spam','newline-spam','repeated-characters','length-limit','emoji-spam','ratelimit','attachment-spam','sticker-spam','link-spam','invite-links','link-blocklist','mention-spam']).notNull(),
	blockedTermsData: json("blocked_terms_data").notNull(),
	blockedStickersData: json("blocked_stickers_data").notNull(),
	capsSpamData: json("caps_spam_data").notNull(),
	newlineSpamData: json("newline_spam_data").notNull(),
	repeatedCharactersData: json("repeated_characters_data").notNull(),
	lengthLimitData: json("length_limit_data").notNull(),
	emojiSpamData: json("emoji_spam_data").notNull(),
	ratelimitData: json("ratelimit_data").notNull(),
	attachmentSpamData: json("attachment_spam_data").notNull(),
	stickerSpamData: json("sticker_spam_data").notNull(),
	linkSpamData: json("link_spam_data").notNull(),
	inviteLinksData: json("invite_links_data").notNull(),
	linkBlocklistData: json("link_blocklist_data").notNull(),
	mentionSpamData: json("mention_spam_data").notNull(),
	reportToChannel: tinyint("report_to_channel").notNull(),
	deleteMessage: tinyint("delete_message").notNull(),
	notifyAuthor: tinyint("notify_author").notNull(),
	reportChannel: varchar("report_channel", { length: 20 }),
	additionalAction: mysqlEnum("additional_action", ['nothing','warn','mute','timeout','kick','ban']).notNull(),
	actionDuration: bigint("action_duration", { mode: "number" }).notNull(),
	disregardDefaultIgnoredChannels: tinyint("disregard_default_ignored_channels").notNull(),
	disregardDefaultIgnoredRoles: tinyint("disregard_default_ignored_roles").notNull(),
	onlyWatchEnabledChannels: tinyint("only_watch_enabled_channels").notNull(),
	onlyWatchEnabledRoles: tinyint("only_watch_enabled_roles").notNull(),
	ignoredChannels: json("ignored_channels").notNull(),
	ignoredRoles: json("ignored_roles").notNull(),
	watchedChannels: json("watched_channels").notNull(),
	watchedRoles: json("watched_roles").notNull(),
	id: int("id").autoincrement().notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
		guildAutomodItemsId: primaryKey({ columns: [table.id], name: "guild_automod_items_id"}),
	}
});

export const guildAutomodSettings = mysqlTable("guild_automod_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	ignoredChannels: json("ignored_channels").notNull(),
	ignoredRoles: json("ignored_roles").notNull(),
	defaultChannel: varchar("default_channel", { length: 20 }),
	interactWithWebhooks: tinyint("interact_with_webhooks").notNull(),
},
(table) => {
	return {
		guildAutomodSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_automod_settings_guild"}),
	}
});

export const guildAutoresponderItems = mysqlTable("guild_autoresponder_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	enabled: tinyint("enabled").notNull(),
	match: varchar("match", { length: 4000 }).notNull(),
	wildcard: tinyint("wildcard").notNull(),
	caseInsensitive: tinyint("case_insensitive").notNull(),
	respondToBotsAndWebhooks: tinyint("respond_to_bots_and_webhooks").notNull(),
	replyMode: mysqlEnum("reply_mode", ['none','normal','reply','ping-reply']).notNull(),
	reaction: varchar("reaction", { length: 20 }),
	message: json("message").notNull(),
	parsed: json("parsed").notNull(),
	bypassDefaultChannelSettings: tinyint("bypass_default_channel_settings").notNull(),
	bypassDefaultRoleSettings: tinyint("bypass_default_role_settings").notNull(),
	onlyInAllowedChannels: tinyint("only_in_allowed_channels").notNull(),
	onlyToAllowedRoles: tinyint("only_to_allowed_roles").notNull(),
	allowedChannels: text("allowed_channels").notNull(),
	allowedRoles: text("allowed_roles").notNull(),
	blockedChannels: text("blocked_channels").notNull(),
	blockedRoles: text("blocked_roles").notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
	}
});

export const guildAutoresponderSettings = mysqlTable("guild_autoresponder_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	onlyInAllowedChannels: tinyint("only_in_allowed_channels").notNull(),
	onlyToAllowedRoles: tinyint("only_to_allowed_roles").notNull(),
	allowedChannels: text("allowed_channels").notNull(),
	allowedRoles: text("allowed_roles").notNull(),
	blockedChannels: text("blocked_channels").notNull(),
	blockedRoles: text("blocked_roles").notNull(),
},
(table) => {
	return {
		guildAutoresponderSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_autoresponder_settings_guild"}),
	}
});

export const guildAutorolesSettings = mysqlTable("guild_autoroles_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	roles: text("roles").notNull(),
},
(table) => {
	return {
		guildAutorolesSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_autoroles_settings_guild"}),
	}
});

export const guildCoOpSettings = mysqlTable("guild_co_op_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	wl0: varchar("wl0", { length: 20 }),
	wl1: varchar("wl1", { length: 20 }),
	wl2: varchar("wl2", { length: 20 }),
	wl3: varchar("wl3", { length: 20 }),
	wl4: varchar("wl4", { length: 20 }),
	wl5: varchar("wl5", { length: 20 }),
	wl6: varchar("wl6", { length: 20 }),
	wl7: varchar("wl7", { length: 20 }),
	wl8: varchar("wl8", { length: 20 }),
	regionNa: varchar("region_na", { length: 20 }),
	regionEu: varchar("region_eu", { length: 20 }),
	regionAs: varchar("region_as", { length: 20 }),
	regionSa: varchar("region_sa", { length: 20 }),
	helperNa: varchar("helper_na", { length: 20 }),
	helperEu: varchar("helper_eu", { length: 20 }),
	helperAs: varchar("helper_as", { length: 20 }),
	helperSa: varchar("helper_sa", { length: 20 }),
},
(table) => {
	return {
		guildCoOpSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_co_op_settings_guild"}),
	}
});

export const guildCommandsSettings = mysqlTable("guild_commands_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	command: varchar("command", { length: 32 }).notNull(),
	enabled: tinyint("enabled").notNull(),
	ignoreDefaultPermissions: tinyint("ignore_default_permissions").notNull(),
	allowedRoles: text("allowed_roles").notNull(),
	blockedRoles: text("blocked_roles").notNull(),
	restrictChannels: tinyint("restrict_channels").notNull(),
	allowedChannels: text("allowed_channels").notNull(),
	blockedChannels: text("blocked_channels").notNull(),
},
(table) => {
	return {
		guildCommandsSettingsGuildCommand: primaryKey({ columns: [table.guild, table.command], name: "guild_commands_settings_guild_command"}),
	}
});

export const guildCountItems = mysqlTable("guild_count_items", {
	id: int("id").autoincrement().notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
	interval: int("interval").notNull(),
	next: int("next").notNull(),
	allowDoubleCounting: tinyint("allow_double_counting").notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
		idxChannel: index("idx_channel").on(table.channel),
		guildCountItemsId: primaryKey({ columns: [table.id], name: "guild_count_items_id"}),
	}
});

export const guildCustomRolesSettings = mysqlTable("guild_custom_roles_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	allowBoosters: tinyint("allow_boosters").notNull(),
	roles: text("roles").notNull(),
	anchor: varchar("anchor", { length: 20 }),
},
(table) => {
	return {
		guildCustomRolesSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_custom_roles_settings_guild"}),
	}
});

export const guildGiveawayItems = mysqlTable("guild_giveaway_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: int("id").notNull(),
	name: varchar("name", { length: 128 }).notNull(),
	channel: varchar("channel", { length: 20 }),
	message: json("message").notNull(),
	requiredRoles: text("required_roles").notNull(),
	requiredRolesAll: tinyint("required_roles_all").notNull(),
	blockedRoles: text("blocked_roles").notNull(),
	blockedRolesAll: tinyint("blocked_roles_all").notNull(),
	bypassRoles: text("bypass_roles").notNull(),
	bypassRolesAll: tinyint("bypass_roles_all").notNull(),
	stackWeights: tinyint("stack_weights").notNull(),
	weights: text("weights").notNull(),
	winners: int("winners").notNull(),
	allowRepeatWinners: tinyint("allow_repeat_winners").notNull(),
	deadline: bigint("deadline", { mode: "number" }).notNull(),
	messageId: varchar("message_id", { length: 20 }),
	error: text("error"),
	closed: tinyint("closed").notNull(),
},
(table) => {
	return {
		idxMessage: index("idx_message").on(table.messageId),
		idxDeadlineClosed: index("idx_deadline_closed").on(table.deadline),
		guildGiveawayItemsGuildId: primaryKey({ columns: [table.guild, table.id], name: "guild_giveaway_items_guild_id"}),
	}
});

export const guildGiveawayTemplates = mysqlTable("guild_giveaway_templates", {
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }),
	message: json("message").notNull(),
	requiredRoles: text("required_roles").notNull(),
	requiredRolesAll: tinyint("required_roles_all").notNull(),
	blockedRoles: text("blocked_roles").notNull(),
	blockedRolesAll: tinyint("blocked_roles_all").notNull(),
	bypassRoles: text("bypass_roles").notNull(),
	bypassRolesAll: tinyint("bypass_roles_all").notNull(),
	stackWeights: tinyint("stack_weights").notNull(),
	weights: text("weights").notNull(),
	winners: int("winners").notNull(),
	allowRepeatWinners: tinyint("allow_repeat_winners").notNull(),
},
(table) => {
	return {
		guildGiveawayTemplatesGuild: primaryKey({ columns: [table.guild], name: "guild_giveaway_templates_guild"}),
	}
});

export const guildLoggingSettings = mysqlTable("guild_logging_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	useWebhook: tinyint("use_webhook").notNull(),
	channel: varchar("channel", { length: 20 }),
	webhook: varchar("webhook", { length: 128 }).notNull(),
	ignoredChannels: text("ignored_channels").notNull(),
	fileOnlyMode: tinyint("file_only_mode").notNull(),
	enableWebLogging: tinyint("enable_web_logging").notNull(),
},
(table) => {
	return {
		guildLoggingSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_logging_settings_guild"}),
	}
});

export const guildLoggingSettingsItems = mysqlTable("guild_logging_settings_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	key: varchar("key", { length: 32 }).notNull(),
	enabled: tinyint("enabled").notNull(),
	useWebhook: tinyint("use_webhook").notNull(),
	channel: varchar("channel", { length: 20 }),
	webhook: varchar("webhook", { length: 128 }).notNull(),
},
(table) => {
	return {
		guildLoggingSettingsItemsGuildKey: primaryKey({ columns: [table.guild, table.key], name: "guild_logging_settings_items_guild_key"}),
	}
});

export const guildModmailItems = mysqlTable("guild_modmail_items", {
	id: int("id").autoincrement().notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	description: varchar("description", { length: 100 }).notNull(),
	emoji: varchar("emoji", { length: 20 }),
	useThreads: tinyint("use_threads").notNull(),
	channel: varchar("channel", { length: 20 }),
	category: varchar("category", { length: 20 }),
	pingRoles: text("ping_roles").notNull(),
	pingHere: tinyint("ping_here").notNull(),
	openMessage: text("open_message").notNull(),
	closeMessage: text("close_message").notNull(),
	openParsed: json("open_parsed").notNull(),
	closeParsed: json("close_parsed").notNull(),
	accessRoles: text("access_roles").notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
		guildModmailItemsId: primaryKey({ columns: [table.id], name: "guild_modmail_items_id"}),
	}
});

export const guildModmailSettings = mysqlTable("guild_modmail_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	useMulti: tinyint("use_multi").notNull(),
},
(table) => {
	return {
		guildModmailSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_modmail_settings_guild"}),
	}
});

export const guildModmailSnippets = mysqlTable("guild_modmail_snippets", {
	guild: varchar("guild", { length: 20 }).notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	content: text("content").notNull(),
	parsed: json("parsed").notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
	}
});

export const guildModulesSettings = mysqlTable("guild_modules_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	module: varchar("module", { length: 32 }).notNull(),
	enabled: tinyint("enabled").notNull(),
},
(table) => {
	return {
		guildModulesSettingsGuildModule: primaryKey({ columns: [table.guild, table.module], name: "guild_modules_settings_guild_module"}),
	}
});

export const guildNukeguardSettings = mysqlTable("guild_nukeguard_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	adminChannel: varchar("admin_channel", { length: 20 }),
	pingRoles: text("ping_roles").notNull(),
	pingHere: tinyint("ping_here").notNull(),
	exemptedRoles: text("exempted_roles").notNull(),
	watchChannelsByDefault: tinyint("watch_channels_by_default").notNull(),
	ignoredChannels: text("ignored_channels").notNull(),
	watchedChannels: text("watched_channels").notNull(),
	watchRolesByDefault: tinyint("watch_roles_by_default").notNull(),
	ignoredRoles: text("ignored_roles").notNull(),
	watchedRoles: text("watched_roles").notNull(),
	watchEmoji: tinyint("watch_emoji").notNull(),
	watchStickers: tinyint("watch_stickers").notNull(),
	watchSounds: tinyint("watch_sounds").notNull(),
	preventWebhookCreation: tinyint("prevent_webhook_creation").notNull(),
	watchWebhookDeletion: tinyint("watch_webhook_deletion").notNull(),
	enableRatelimit: tinyint("enable_ratelimit").notNull(),
	ratelimitKicking: tinyint("ratelimit_kicking").notNull(),
	ratelimitThreshold: int("ratelimit_threshold"),
	ratelimitTime: int("ratelimit_time"),
	restrictRolesLenient: tinyint("restrict_roles_lenient").notNull(),
	restrictRolesByDefault: tinyint("restrict_roles_by_default").notNull(),
	restrictRolesAllowedRoles: text("restrict_roles_allowed_roles").notNull(),
	restrictRolesBlockedRoles: text("restrict_roles_blocked_roles").notNull(),
},
(table) => {
	return {
		guildNukeguardSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_nukeguard_settings_guild"}),
	}
});

export const guildPremiumSettings = mysqlTable("guild_premium_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	status: mysqlEnum("status", ['online','idle','dnd','invisible']).default('online').notNull(),
	activityType: mysqlEnum("activity_type", ['none','playing','listening-to','watching','competing-in']).default('watching').notNull(),
	activity: varchar("activity", { length: 64 }).default('for /help').notNull(),
	hasPremium: tinyint("has_premium").default(0).notNull(),
	hasCustom: tinyint("has_custom").default(0).notNull(),
},
(table) => {
	return {
		guildPremiumSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_premium_settings_guild"}),
	}
});

export const guildReactionRolesItems = mysqlTable("guild_reaction_roles_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: bigint("id", { mode: "number" }).notNull(),
	name: varchar("name", { length: 128 }).notNull(),
	addToExisting: tinyint("add_to_existing").notNull(),
	channel: varchar("channel", { length: 20 }),
	message: varchar("message", { length: 20 }),
	url: varchar("url", { length: 128 }).notNull(),
	style: mysqlEnum("style", ['dropdown','buttons','reactions']).notNull(),
	type: mysqlEnum("type", ['normal','unique','verify','lock']).notNull(),
	dropdownData: json("dropdown_data").notNull(),
	buttonData: json("button_data").notNull(),
	reactionData: json("reaction_data").notNull(),
	promptMessage: json("prompt_message").notNull(),
	error: text("error"),
},
(table) => {
	return {
		unqGuildId: unique("unq_guild_id").on(table.guild, table.id),
	}
});

export const guildRedditFeedsItems = mysqlTable("guild_reddit_feeds_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	subreddit: varchar("subreddit", { length: 32 }).notNull(),
	channel: varchar("channel", { length: 20 }),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
	}
});

export const guildReportsSettings = mysqlTable("guild_reports_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }),
	pingRoles: text("ping_roles").notNull(),
	anon: tinyint("anon").notNull(),
	viewRoles: text("view_roles").notNull(),
},
(table) => {
	return {
		guildReportsSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_reports_settings_guild"}),
	}
});

export const guildSettings = mysqlTable("guild_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	dashboardPermission: mysqlEnum("dashboard_permission", ['owner','admin','manager']).default('manager').notNull(),
	embedColor: int("embed_color").default(38536).notNull(),
	muteRole: varchar("mute_role", { length: 20 }),
	banFooter: varchar("ban_footer", { length: 1024 }).default('').notNull(),
	modOnly: tinyint("mod_only").default(0).notNull(),
	allowedRoles: text("allowed_roles").default(sql`''`).notNull(),
	allowlistOnly: tinyint("allowlist_only").default(0).notNull(),
	allowedChannels: text("allowed_channels").default(sql`''`).notNull(),
	blockedChannels: text("blocked_channels").default(sql`''`).notNull(),
	blockedRoles: text("blocked_roles").default(sql`''`).notNull(),
},
(table) => {
	return {
		guildSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_settings_guild"}),
	}
});

export const guildStarboardOverrides = mysqlTable("guild_starboard_overrides", {
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
	enabled: tinyint("enabled").notNull(),
	target: varchar("target", { length: 20 }),
	threshold: int("threshold"),
},
(table) => {
	return {
		guildStarboardOverridesGuildChannel: primaryKey({ columns: [table.guild, table.channel], name: "guild_starboard_overrides_guild_channel"}),
	}
});

export const guildStarboardSettings = mysqlTable("guild_starboard_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	reaction: varchar("reaction", { length: 20 }),
	channel: varchar("channel", { length: 20 }),
	threshold: int("threshold").notNull(),
},
(table) => {
	return {
		guildStarboardSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_starboard_settings_guild"}),
	}
});

export const guildStatsChannelsItems = mysqlTable("guild_stats_channels_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
	format: text("format").notNull(),
	parsed: json("parsed").notNull(),
},
(table) => {
	return {
		guildStatsChannelsItemsGuildChannel: primaryKey({ columns: [table.guild, table.channel], name: "guild_stats_channels_items_guild_channel"}),
	}
});

export const guildStickyRolesSettings = mysqlTable("guild_sticky_roles_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	roles: text("roles").notNull(),
},
(table) => {
	return {
		guildStickyRolesSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_sticky_roles_settings_guild"}),
	}
});

export const guildSuggestionsSettings = mysqlTable("guild_suggestions_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }),
	anon: tinyint("anon").notNull(),
},
(table) => {
	return {
		guildSuggestionsSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_suggestions_settings_guild"}),
	}
});

export const guildSupporterAnnouncementsItems = mysqlTable("guild_supporter_announcements_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	useBoosts: tinyint("use_boosts").notNull(),
	role: varchar("role", { length: 20 }),
	channel: varchar("channel", { length: 20 }),
	message: json("message").notNull(),
	parsed: json("parsed").notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
	}
});

export const guildTicketsItems = mysqlTable("guild_tickets_items", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: bigint("id", { mode: "number" }).notNull(),
	name: varchar("name", { length: 128 }).notNull(),
	channel: varchar("channel", { length: 20 }),
	message: varchar("message", { length: 20 }),
	prompt: json("prompt").notNull(),
	useMulti: tinyint("use_multi").notNull(),
	error: text("error"),
},
(table) => {
	return {
		unqGuildId: unique("unq_guild_id").on(table.guild, table.id),
	}
});

export const guildTicketsTargets = mysqlTable("guild_tickets_targets", {
	id: bigint("id", { mode: "number" }).notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }),
	category: varchar("category", { length: 20 }),
	buttonLabel: varchar("button_label", { length: 80 }).notNull(),
	buttonColor: mysqlEnum("button_color", ['gray','blue','green','red']).notNull(),
	dropdownLabel: varchar("dropdown_label", { length: 100 }).notNull(),
	dropdownDescription: varchar("dropdown_description", { length: 100 }).notNull(),
	emoji: varchar("emoji", { length: 20 }),
	pingRoles: text("ping_roles").notNull(),
	pingHere: tinyint("ping_here").notNull(),
	postCustomOpenMessage: tinyint("post_custom_open_message").notNull(),
	customOpenMessage: json("custom_open_message").notNull(),
	customOpenParsed: json("custom_open_parsed").notNull(),
	promptId: bigint("prompt_id", { mode: "number" }).notNull(),
	name: varchar("name", { length: 128 }).notNull(),
	accessRoles: text("access_roles").notNull(),
},
(table) => {
	return {
		unqGuildId: unique("unq_guild_id").on(table.guild, table.id),
	}
});

export const guildUtilitySettings = mysqlTable("guild_utility_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	roleCommandBlockByDefault: tinyint("role_command_block_by_default").notNull(),
	roleCommandBlockedRoles: text("role_command_blocked_roles").notNull(),
	roleCommandAllowedRoles: text("role_command_allowed_roles").notNull(),
	roleCommandBypassRoles: text("role_command_bypass_roles").notNull(),
},
(table) => {
	return {
		guildUtilitySettingsGuild: primaryKey({ columns: [table.guild], name: "guild_utility_settings_guild"}),
	}
});

export const guildWelcomeSettings = mysqlTable("guild_welcome_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }),
	message: json("message").notNull(),
	parsed: json("parsed").notNull(),
},
(table) => {
	return {
		guildWelcomeSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_welcome_settings_guild"}),
	}
});

export const guildXpSettings = mysqlTable("guild_xp_settings", {
	guild: varchar("guild", { length: 20 }).notNull(),
	blockedChannels: text("blocked_channels").notNull(),
	blockedRoles: text("blocked_roles").notNull(),
	bonusChannels: text("bonus_channels").notNull(),
	bonusRoles: text("bonus_roles").notNull(),
	rankCardBackground: text("rank_card_background").notNull(),
	announceLevelUp: tinyint("announce_level_up").notNull(),
	announceInChannel: tinyint("announce_in_channel").notNull(),
	announceChannel: varchar("announce_channel", { length: 20 }),
	announcementBackground: text("announcement_background").notNull(),
	rewards: text("rewards").notNull(),
},
(table) => {
	return {
		guildXpSettingsGuild: primaryKey({ columns: [table.guild], name: "guild_xp_settings_guild"}),
	}
});

export const highlights = mysqlTable("highlights", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	phrases: json("phrases").notNull(),
	replies: tinyint("replies").notNull(),
	cooldown: int("cooldown").notNull(),
	delay: int("delay").notNull(),
	blockedChannels: text("blocked_channels").notNull(),
	blockedUsers: text("blocked_users").notNull(),
},
(table) => {
	return {
		highlightsGuildUser: primaryKey({ columns: [table.guild, table.user], name: "highlights_guild_user"}),
	}
});

export const historyIds = mysqlTable("history_ids", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: int("id").notNull(),
},
(table) => {
	return {
		historyIdsGuild: primaryKey({ columns: [table.guild], name: "history_ids_guild"}),
	}
});

export const limitOverrides = mysqlTable("limit_overrides", {
	guild: varchar("guild", { length: 20 }).notNull(),
	supporterAnnouncementsCountLimit: int("supporter_announcements_count_limit"),
	xpBonusChannelCountLimit: int("xp_bonus_channel_count_limit"),
	xpBonusRoleCountLimit: int("xp_bonus_role_count_limit"),
	xpRewardCountLimit: int("xp_reward_count_limit"),
	reactionRolesCountLimit: int("reaction_roles_count_limit"),
	purgeAtOnceLimit: int("purge_at_once_limit"),
	automodCountLimit: int("automod_count_limit"),
	statsChannelsCountLimit: int("stats_channels_count_limit"),
	autoresponderCountLimit: int("autoresponder_count_limit"),
	modmailTargetCountLimit: int("modmail_target_count_limit"),
	ticketPromptCountLimit: int("ticket_prompt_count_limit"),
	ticketTargetCountLimit: int("ticket_target_count_limit"),
	redditFeedsCountLimit: int("reddit_feeds_count_limit"),
	countCountLimit: int("count_count_limit"),
	customizeXpBackgrounds: tinyint("customize_xp_backgrounds"),
	multiModmail: tinyint("multi_modmail"),
	multiTickets: tinyint("multi_tickets"),
	customizeTicketOpenMessage: tinyint("customize_ticket_open_message"),
},
(table) => {
	return {
		limitOverridesGuild: primaryKey({ columns: [table.guild], name: "limit_overrides_guild"}),
	}
});

export const moderationRemovalTasks = mysqlTable("moderation_removal_tasks", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	action: mysqlEnum("action", ['unmute','unban']).notNull(),
	time: bigint("time", { mode: "number" }).notNull(),
},
(table) => {
	return {
		moderationRemovalTasksGuildUserAction: primaryKey({ columns: [table.guild, table.user, table.action], name: "moderation_removal_tasks_guild_user_action"}),
	}
});

export const modmailAutoclose = mysqlTable("modmail_autoclose", {
	channel: varchar("channel", { length: 20 }).notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	author: varchar("author", { length: 20 }).notNull(),
	notify: tinyint("notify").notNull(),
	message: varchar("message", { length: 4000 }).notNull(),
	time: bigint("time", { mode: "number" }).notNull(),
},
(table) => {
	return {
		modmailAutocloseChannel: primaryKey({ columns: [table.channel], name: "modmail_autoclose_channel"}),
	}
});

export const modmailMessages = mysqlTable("modmail_messages", {
	uuid: varchar("uuid", { length: 36 }).notNull(),
	time: timestamp("time", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	type: mysqlEnum("type", ['open','incoming','internal','outgoing','close']),
	id: varchar("id", { length: 20 }).notNull(),
	source: varchar("source", { length: 36 }).notNull(),
	target: varchar("target", { length: 20 }).notNull(),
	author: varchar("author", { length: 20 }).notNull(),
	anon: tinyint("anon").notNull(),
	targetName: varchar("target_name", { length: 100 }).notNull(),
	content: text("content").notNull(),
	edits: json("edits").notNull(),
	attachments: json("attachments").notNull(),
	deleted: tinyint("deleted").notNull(),
	sent: tinyint("sent").notNull(),
	encrypted: tinyint("encrypted").default(1).notNull(),
},
(table) => {
	return {
		idxId: index("idx_id").on(table.id),
		idxUuidSource: index("idx_uuid_source").on(table.uuid, table.source),
	}
});

export const modmailNotifications = mysqlTable("modmail_notifications", {
	channel: varchar("channel", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	once: tinyint("once").notNull(),
},
(table) => {
	return {
		idxOnce: index("idx_once").on(table.once),
		modmailNotificationsChannelUser: primaryKey({ columns: [table.channel, table.user], name: "modmail_notifications_channel_user"}),
	}
});

export const modmailThreads = mysqlTable("modmail_threads", {
	uuid: varchar("uuid", { length: 36 }).notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	targetId: int("target_id").notNull(),
	closed: tinyint("closed").notNull(),
},
(table) => {
	return {
		idxUser: index("idx_user").on(table.user),
		modmailThreadsChannel: primaryKey({ columns: [table.channel], name: "modmail_threads_channel"}),
		unqUuid: unique("unq_uuid").on(table.uuid),
		unqGuildUserTarget: unique("unq_guild_user_target").on(table.guild, table.user, table.targetId),
	}
});

export const news = mysqlTable("news", {
	code: varchar("code", { length: 64 }).notNull(),
	date: timestamp("date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	title: varchar("title", { length: 64 }).notNull(),
	subtitle: varchar("subtitle", { length: 64 }).notNull(),
	summary: varchar("summary", { length: 256 }).notNull(),
	body: text("body").notNull(),
},
(table) => {
	return {
		idxDate: index("idx_date").on(table.date),
		newsCode: primaryKey({ columns: [table.code], name: "news_code"}),
	}
});

export const notes = mysqlTable("notes", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	notes: varchar("notes", { length: 4096 }).notNull(),
},
(table) => {
	return {
		notesGuildUser: primaryKey({ columns: [table.guild, table.user], name: "notes_guild_user"}),
	}
});

export const paymentLinks = mysqlTable("payment_links", {
	key: varchar("key", { length: 256 }).notNull(),
	links: text("links").notNull(),
},
(table) => {
	return {
		paymentLinksKey: primaryKey({ columns: [table.key], name: "payment_links_key"}),
	}
});

export const pollVotes = mysqlTable("poll_votes", {
	message: varchar("message", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	vote: text("vote").notNull(),
},
(table) => {
	return {
		pollVotesMessageUser: primaryKey({ columns: [table.message, table.user], name: "poll_votes_message_user"}),
	}
});

export const polls = mysqlTable("polls", {
	message: varchar("message", { length: 20 }).notNull(),
	type: mysqlEnum("type", ['yes-no','binary','multi']).notNull(),
	question: varchar("question", { length: 1024 }).notNull(),
	allowNeutral: tinyint("allow_neutral").notNull(),
	allowMulti: tinyint("allow_multi").notNull(),
	leftOption: varchar("left_option", { length: 80 }).notNull(),
	rightOption: varchar("right_option", { length: 80 }).notNull(),
	options: json("options").notNull(),
},
(table) => {
	return {
		pollsMessage: primaryKey({ columns: [table.message], name: "polls_message"}),
	}
});

export const premiumKeyBindings = mysqlTable("premium_key_bindings", {
	key: varchar("key", { length: 32 }).notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
},
(table) => {
	return {
		premiumKeyBindingsKey: primaryKey({ columns: [table.key], name: "premium_key_bindings_key"}),
	}
});

export const premiumKeys = mysqlTable("premium_keys", {
	user: varchar("user", { length: 20 }).notNull(),
	key: varchar("key", { length: 32 }).notNull(),
	disabled: tinyint("disabled").default(0).notNull(),
	time: timestamp("time", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	name: varchar("name", { length: 64 }),
},
(table) => {
	return {
		idxTime: index("idx_time").on(table.time),
		premiumKeysUserKey: primaryKey({ columns: [table.user, table.key], name: "premium_keys_user_key"}),
		premiumKeysKeyUnique: unique("premium_keys_key_unique").on(table.key),
	}
});

export const redditRequestLog = mysqlTable("reddit_request_log", {
	time: timestamp("time", { mode: 'string' }).defaultNow().notNull(),
	success: tinyint("success").notNull(),
	subreddit: varchar("subreddit", { length: 32 }).notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
},
(table) => {
	return {
		idxTime: index("idx_time").on(table.time),
	}
});

export const reminderIds = mysqlTable("reminder_ids", {
	user: varchar("user", { length: 20 }).notNull(),
	id: int("id").notNull(),
},
(table) => {
	return {
		reminderIdsUser: primaryKey({ columns: [table.user], name: "reminder_ids_user"}),
	}
});

export const reminders = mysqlTable("reminders", {
	id: int("id").notNull(),
	guild: varchar("guild", { length: 20 }),
	user: varchar("user", { length: 20 }).notNull(),
	time: bigint("time", { mode: "number" }).notNull(),
	query: varchar("query", { length: 1024 }),
	origin: varchar("origin", { length: 128 }).notNull(),
	client: varchar("client", { length: 20 }).notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
		idxTime: index("idx_time").on(table.time),
		remindersUserId: primaryKey({ columns: [table.user, table.id], name: "reminders_user_id"}),
	}
});

export const reporters = mysqlTable("reporters", {
	message: varchar("message", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
},
(table) => {
	return {
		reportersMessage: primaryKey({ columns: [table.message], name: "reporters_message"}),
	}
});

export const starboardLinks = mysqlTable("starboard_links", {
	source: varchar("source", { length: 20 }).notNull(),
	target: varchar("target", { length: 20 }).notNull(),
},
(table) => {
	return {
		starboardLinksSource: primaryKey({ columns: [table.source], name: "starboard_links_source"}),
	}
});

export const stickyMessages = mysqlTable("sticky_messages", {
	guild: varchar("guild", { length: 20 }).notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
	message: varchar("message", { length: 20 }),
	content: varchar("content", { length: 4000 }).notNull(),
	seconds: int("seconds").notNull(),
},
(table) => {
	return {
		idxGuild: index("idx_guild").on(table.guild),
		stickyMessagesChannel: primaryKey({ columns: [table.channel], name: "sticky_messages_channel"}),
	}
});

export const stickyRoles = mysqlTable("sticky_roles", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	role: varchar("role", { length: 20 }).notNull(),
},
(table) => {
	return {
		stickyRolesGuildUserRole: primaryKey({ columns: [table.guild, table.user, table.role], name: "sticky_roles_guild_user_role"}),
	}
});

export const suggestionIds = mysqlTable("suggestion_ids", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: int("id").notNull(),
},
(table) => {
	return {
		suggestionIdsGuild: primaryKey({ columns: [table.guild], name: "suggestion_ids_guild"}),
	}
});

export const suggestionVotes = mysqlTable("suggestion_votes", {
	message: varchar("message", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	yes: tinyint("yes").notNull(),
},
(table) => {
	return {
		idxYes: index("idx_yes").on(table.yes),
		suggestionVotesMessageUser: primaryKey({ columns: [table.message, table.user], name: "suggestion_votes_message_user"}),
	}
});

export const suggestions = mysqlTable("suggestions", {
	guild: varchar("guild", { length: 20 }).notNull(),
	id: int("id").notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
	message: varchar("message", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
},
(table) => {
	return {
		suggestionsGuildId: primaryKey({ columns: [table.guild, table.id], name: "suggestions_guild_id"}),
	}
});

export const ticketMessages = mysqlTable("ticket_messages", {
	uuid: varchar("uuid", { length: 36 }).notNull(),
	type: mysqlEnum("type", ['open','message','close']),
	id: varchar("id", { length: 20 }),
	author: varchar("author", { length: 20 }).notNull(),
	content: text("content").notNull(),
	attachments: json("attachments").notNull(),
	edits: json("edits").notNull(),
	deleted: tinyint("deleted").notNull(),
	time: timestamp("time", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	encrypted: tinyint("encrypted").default(1).notNull(),
},
(table) => {
	return {
		idxUuid: index("idx_uuid").on(table.uuid),
		idxId: index("idx_id").on(table.id),
	}
});

export const tickets = mysqlTable("tickets", {
	uuid: varchar("uuid", { length: 36 }).notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	prompt: bigint("prompt", { mode: "number" }).notNull(),
	target: bigint("target", { mode: "number" }).notNull(),
	closed: tinyint("closed").notNull(),
	channel: varchar("channel", { length: 20 }).notNull(),
},
(table) => {
	return {
		idxGuildUserPromptTarget: index("idx_guild_user_prompt_target").on(table.guild, table.user, table.prompt, table.target),
		idxChannelClosed: index("idx_channel_closed").on(table.channel, table.closed),
		ticketsUuid: primaryKey({ columns: [table.uuid], name: "tickets_uuid"}),
	}
});

export const tokens = mysqlTable("tokens", {
	guild: varchar("guild", { length: 20 }).notNull(),
	token: varchar("token", { length: 128 }).notNull(),
},
(table) => {
	return {
		tokensGuild: primaryKey({ columns: [table.guild], name: "tokens_guild"}),
	}
});

export const userHistory = mysqlTable("user_history", {
	id: int("id").notNull(),
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	type: mysqlEnum("type", ['ban','kick','timeout','mute','informal_warn','warn','bulk']).notNull(),
	mod: varchar("mod", { length: 20 }).notNull(),
	time: timestamp("time", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	duration: bigint("duration", { mode: "number" }),
	origin: varchar("origin", { length: 128 }),
	reason: varchar("reason", { length: 512 }),
},
(table) => {
	return {
		idxGuildUser: index("idx_guild_user").on(table.guild, table.user),
		userHistoryGuildId: primaryKey({ columns: [table.guild, table.id], name: "user_history_guild_id"}),
	}
});

export const xpAmounts = mysqlTable("xp_amounts", {
	guild: varchar("guild", { length: 20 }).notNull(),
	user: varchar("user", { length: 20 }).notNull(),
	textDaily: float("text_daily").notNull(),
	textWeekly: float("text_weekly").notNull(),
	textMonthly: float("text_monthly").notNull(),
	textTotal: float("text_total").notNull(),
	voiceDaily: float("voice_daily").notNull(),
	voiceWeekly: float("voice_weekly").notNull(),
	voiceMonthly: float("voice_monthly").notNull(),
	voiceTotal: float("voice_total").notNull(),
},
(table) => {
	return {
		idxTextDaily: index("idx_text_daily").on(table.textDaily),
		idxTextWeekly: index("idx_text_weekly").on(table.textWeekly),
		idxTextMonthly: index("idx_text_monthly").on(table.textMonthly),
		idxTextTotal: index("idx_text_total").on(table.textTotal),
		idxVoiceDaily: index("idx_voice_daily").on(table.voiceDaily),
		idxVoiceWeekly: index("idx_voice_weekly").on(table.voiceWeekly),
		idxVoiceMonthly: index("idx_voice_monthly").on(table.voiceMonthly),
		idxVoiceTotal: index("idx_voice_total").on(table.voiceTotal),
	}
});