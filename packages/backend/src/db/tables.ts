import { sql } from "drizzle-orm";
import { bigint, boolean, float, index, int, json, mysqlEnum, mysqlTable, primaryKey, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

export const admins = mysqlTable("admins", {
    id: varchar("id", { length: 20 }).notNull().primaryKey(),
});

export const tokens = mysqlTable("tokens", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    token: varchar("token", { length: 128 }).notNull(),
});

export const guildSettings = mysqlTable("guild_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    dashboardPermission: mysqlEnum("dashboard_permission", ["owner", "admin", "manager"]).notNull().default("manager"),
    embedColor: int("embed_color").notNull().default(0x009688),
    muteRole: varchar("mute_role", { length: 20 }),
    banFooter: varchar("ban_footer", { length: 1024 }).notNull().default(""),
    modOnly: boolean("mod_only").notNull().default(false),
    allowedRoles: text("allowed_roles").notNull().default(""),
    blockedRoles: text("blocked_roles").notNull().default(""),
    allowlistOnly: boolean("allowlist_only").notNull().default(false),
    allowedChannels: text("allowed_channels").notNull().default(""),
    blockedChannels: text("blocked_channels").notNull().default(""),
});

export const guildPremiumSettings = mysqlTable("guild_premium_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    hasPremium: boolean("has_premium").notNull().default(false),
    hasCustom: boolean("has_custom").notNull().default(false),
    status: mysqlEnum("status", ["online", "idle", "dnd", "invisible"]).notNull().default("online"),
    activityType: mysqlEnum("activity_type", ["none", "playing", "listening-to", "watching", "competing-in"]).notNull().default("watching"),
    activity: varchar("activity", { length: 64 }).notNull().default("for /help"),
});

export const guildModulesSettings = mysqlTable(
    "guild_modules_settings",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        module: varchar("module", { length: 32 }).notNull(),
        enabled: boolean("enabled").notNull(),
    },
    (t) => ({
        pk_guild_module: primaryKey({ name: "pk_guild_module", columns: [t.guild, t.module] }),
    }),
);

export const guildCommandsSettings = mysqlTable(
    "guild_commands_settings",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        command: varchar("command", { length: 32 }).notNull(),
        enabled: boolean("enabled").notNull(),
        ignoreDefaultPermissions: boolean("ignore_default_permissions").notNull(),
        allowedRoles: text("allowed_roles").notNull(),
        blockedRoles: text("blocked_roles").notNull(),
        restrictChannels: boolean("restrict_channels").notNull(),
        allowedChannels: text("allowed_channels").notNull(),
        blockedChannels: text("blocked_channels").notNull(),
    },
    (t) => ({
        pk_guild_command: primaryKey({ name: "pk_guild_command", columns: [t.guild, t.command] }),
    }),
);

export const guildLoggingSettings = mysqlTable("guild_logging_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    useWebhook: boolean("use_webhook").notNull(),
    channel: varchar("channel", { length: 20 }),
    webhook: varchar("webhook", { length: 128 }).notNull(),
    ignoredChannels: text("ignored_channels").notNull(),
    fileOnlyMode: boolean("file_only_mode").notNull(),
});

export const guildLoggingSettingsItems = mysqlTable(
    "guild_logging_settings_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        key: varchar("key", { length: 32 }).notNull(),
        enabled: boolean("enabled").notNull(),
        useWebhook: boolean("use_webhook").notNull(),
        channel: varchar("channel", { length: 20 }),
        webhook: varchar("webhook", { length: 128 }).notNull(),
    },
    (t) => ({
        pk_guild_key: primaryKey({ name: "pk_guild_key", columns: [t.guild, t.key] }),
    }),
);

export const guildWelcomeSettings = mysqlTable("guild_welcome_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    channel: varchar("channel", { length: 20 }),
    message: json("message").notNull(),
    parsed: json("parsed").notNull(),
});

export const guildSupporterAnnouncementsItems = mysqlTable(
    "guild_supporter_announcements_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        useBoosts: boolean("use_boosts").notNull(),
        role: varchar("role", { length: 20 }),
        channel: varchar("channel", { length: 20 }),
        message: json("message").notNull(),
        parsed: json("parsed").notNull(),
    },
    (t) => ({
        idx_guild: index("idx_guild").on(t.guild),
    }),
);

export const guildXpSettings = mysqlTable("guild_xp_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    blockedChannels: text("blocked_channels").notNull(),
    blockedRoles: text("blocked_roles").notNull(),
    bonusChannels: text("bonus_channels").notNull(),
    bonusRoles: text("bonus_roles").notNull(),
    rankCardBackground: varchar("rank_card_background", { length: 1024 }).notNull(),
    announceLevelUp: boolean("announce_level_up").notNull(),
    announceInChannel: boolean("announce_in_channel").notNull(),
    announceChannel: varchar("announce_channel", { length: 20 }),
    announcementBackground: varchar("announcement_background", { length: 1024 }).notNull(),
    rewards: text("rewards").notNull(),
});

export const guildReactionRolesItems = mysqlTable(
    "guild_reaction_roles_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        id: bigint("id", { mode: "number" }).notNull(),
        name: varchar("name", { length: 128 }).notNull(),
        addToExisting: boolean("add_to_existing").notNull(),
        channel: varchar("channel", { length: 20 }),
        message: varchar("message", { length: 20 }),
        url: varchar("url", { length: 128 }).notNull(),
        style: mysqlEnum("style", ["dropdown", "buttons", "reactions"]).notNull(),
        type: mysqlEnum("type", ["normal", "unique", "verify", "lock"]).notNull(),
        dropdownData: json("dropdown_data").notNull(),
        buttonData: json("button_data").notNull(),
        reactionData: json("reaction_data").notNull(),
        promptMessage: json("prompt_message").notNull(),
        error: text("error"),
    },
    (t) => ({
        unq_guild_id: unique("unq_guild_id").on(t.guild, t.id),
    }),
);

export const guildStarboardSettings = mysqlTable("guild_starboard_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    reaction: varchar("reaction", { length: 20 }),
    channel: varchar("channel", { length: 20 }),
    threshold: int("threshold").notNull(),
});

export const guildStarboardOverrides = mysqlTable(
    "guild_starboard_overrides",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        channel: varchar("channel", { length: 20 }).notNull(),
        enabled: boolean("enabled").notNull(),
        target: varchar("target", { length: 20 }),
        threshold: int("threshold"),
    },
    (t) => ({
        pk_guild_channel: primaryKey({ name: "pk_guild_channel", columns: [t.guild, t.channel] }),
    }),
);

export const guildAutomodSettings = mysqlTable("guild_automod_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    ignoredChannels: json("ignored_channels").notNull(),
    ignoredRoles: json("ignored_roles").notNull(),
    defaultChannel: varchar("default_channel", { length: 20 }),
    interactWithWebhooks: boolean("interact_with_webhooks").notNull(),
});

export const guildAutomodItems = mysqlTable(
    "guild_automod_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        enable: boolean("enable").notNull(),
        name: varchar("name", { length: 128 }).notNull(),
        type: mysqlEnum("type", [
            "blocked-terms",
            "blocked-stickers",
            "caps-spam",
            "newline-spam",
            "repeated-characters",
            "length-limit",
            "emoji-spam",
            "ratelimit",
            "attachment-spam",
            "sticker-spam",
            "link-spam",
            "invite-links",
            "link-blocklist",
            "mention-spam",
        ]).notNull(),
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
        reportToChannel: boolean("report_to_channel").notNull(),
        deleteMessage: boolean("delete_message").notNull(),
        notifyAuthor: boolean("notify_author").notNull(),
        reportChannel: varchar("report_channel", { length: 20 }),
        additionalAction: mysqlEnum("additional_action", ["nothing", "warn", "mute", "timeout", "kick", "ban"]).notNull(),
        actionDuration: int("action_duration").notNull(),
        disregardDefaultIgnoredChannels: boolean("disregard_default_ignored_channels").notNull(),
        disregardDefaultIgnoredRoles: boolean("disregard_default_ignored_roles").notNull(),
        onlyWatchEnabledChannels: boolean("only_watch_enabled_channels").notNull(),
        onlyWatchEnabledRoles: boolean("only_watch_enabled_roles").notNull(),
        ignoredChannels: json("ignored_channels").notNull(),
        ignoredRoles: json("ignored_roles").notNull(),
        watchedChannels: json("watched_channels").notNull(),
        watchedRoles: json("watched_roles").notNull(),
    },
    (t) => ({
        idx_guild: index("idx_guild").on(t.guild),
    }),
);

export const news = mysqlTable(
    "news",
    {
        code: varchar("code", { length: 64 }).notNull().primaryKey(),
        date: timestamp("date")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        title: varchar("title", { length: 64 }).notNull(),
        subtitle: varchar("subtitle", { length: 64 }).notNull(),
        summary: varchar("summary", { length: 256 }).notNull(),
        body: text("body").notNull(),
    },
    (t) => ({
        idx_date: index("idx_date").on(t.date),
    }),
);

export const customers = mysqlTable(
    "customers",
    {
        discord: varchar("discord", { length: 20 }).notNull(),
        stripe: varchar("stripe", { length: 32 }).notNull().primaryKey(),
    },
    (t) => ({
        idx_discord: index("idx_discord").on(t.discord),
    }),
);

export const paymentLinks = mysqlTable("payment_links", {
    key: varchar("key", { length: 256 }).notNull().primaryKey(),
    links: text("links").notNull(),
});

export const premiumKeys = mysqlTable(
    "premium_keys",
    {
        user: varchar("user", { length: 20 }).notNull(),
        key: varchar("key", { length: 32 }).notNull().unique(),
        disabled: boolean("disabled").notNull().default(false),
        time: timestamp("time")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (t) => ({
        pk_user_key: primaryKey({ name: "pk_user_key", columns: [t.user, t.key] }),
        idx_time: index("idx_time").on(t.time),
    }),
);

export const premiumKeyBindings = mysqlTable("premium_key_bindings", {
    key: varchar("key", { length: 32 }).notNull().primaryKey(),
    guild: varchar("guild", { length: 20 }).notNull(),
});

export const accountSettings = mysqlTable(
    "account_settings",
    {
        user: varchar("user", { length: 20 }).notNull().primaryKey(),
        notifyPremiumOwnedServers: boolean("notify_premium_owned_servers").notNull().default(true),
        notifyPremiumManagedServers: boolean("notify_premium_managed_servers").notNull().default(false),
    },
    (t) => ({
        idx_notify_owned: index("idx_notify_owned").on(t.notifyPremiumOwnedServers),
        idx_notify_managed: index("idx_notify_managed").on(t.notifyPremiumManagedServers),
    }),
);

export const limitOverrides = mysqlTable("limit_overrides", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
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
    customizeXpBackgrounds: boolean("customize_xp_backgrounds"),
    multiModmail: boolean("multi_modmail"),
    multiTickets: boolean("multi_tickets"),
    customizeTicketOpenMessage: boolean("customize_ticket_open_message"),
});

export const xp = mysqlTable(
    "xp_amounts",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        textDaily: float("text_daily").notNull().default(0),
        textWeekly: float("text_weekly").notNull().default(0),
        textMonthly: float("text_monthly").notNull().default(0),
        textTotal: float("text_total").notNull().default(0),
        voiceDaily: float("voice_daily").notNull().default(0),
        voiceWeekly: float("voice_weekly").notNull().default(0),
        voiceMonthly: float("voice_monthly").notNull().default(0),
        voiceTotal: float("voice_total").notNull().default(0),
    },
    (t) => ({
        pk_guild_user: primaryKey({ name: "pk_guild_user", columns: [t.guild, t.user] }),
        idx_text_daily: index("idx_text_daily").on(t.textDaily),
        idx_text_weekly: index("idx_text_weekly").on(t.textWeekly),
        idx_text_monthly: index("idx_text_monthly").on(t.textMonthly),
        idx_text_total: index("idx_text_total").on(t.textTotal),
        idx_voice_daily: index("idx_voice_daily").on(t.voiceDaily),
        idx_voice_weekly: index("idx_voice_weekly").on(t.voiceWeekly),
        idx_voice_monthly: index("idx_voice_monthly").on(t.voiceMonthly),
        idx_voice_total: index("idx_voice_total").on(t.voiceTotal),
    }),
);

export const starboardLinks = mysqlTable("starboard_links", {
    source: varchar("source", { length: 20 }).notNull().primaryKey(),
    target: varchar("target", { length: 20 }).notNull(),
});
