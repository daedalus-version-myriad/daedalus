import { sql } from "drizzle-orm";
import { bigint, boolean, float, index, int, json, mysqlEnum, mysqlTable, primaryKey, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

export const globals = mysqlTable("globals", {
    id: int("id").notNull().primaryKey(),
    lastXpPurge: bigint("last_xp_purge", { mode: "number" }).notNull(),
});

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
    enableWebLogging: boolean("enable_web_logging").notNull(),
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
        id: int("id").notNull().autoincrement().primaryKey(),
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

export const guildStickyRolesSettings = mysqlTable("guild_sticky_roles_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    roles: text("roles").notNull(),
});

export const guildAutorolesSettings = mysqlTable("guild_autoroles_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    roles: text("roles").notNull(),
});

export const guildCustomRolesSettings = mysqlTable("guild_custom_roles_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    allowBoosters: boolean("allow_boosters").notNull(),
    roles: text("roles").notNull(),
    anchor: varchar("anchor", { length: 20 }),
});

export const guildStatsChannelsItems = mysqlTable(
    "guild_stats_channels_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        channel: varchar("channel", { length: 20 }).notNull(),
        format: text("format").notNull(),
        parsed: json("parsed").notNull(),
    },
    (t) => ({
        pk_guild_channel: primaryKey({ name: "pk_guild_channel", columns: [t.guild, t.channel] }),
    }),
);

export const guildAutoresponderSettings = mysqlTable("guild_autoresponder_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    onlyInAllowedChannels: boolean("only_in_allowed_channels").notNull(),
    onlyToAllowedRoles: boolean("only_to_allowed_roles").notNull(),
    allowedChannels: text("allowed_channels").notNull(),
    allowedRoles: text("allowed_roles").notNull(),
    blockedChannels: text("blocked_channels").notNull(),
    blockedRoles: text("blocked_roles").notNull(),
});

export const guildAutoresponderItems = mysqlTable(
    "guild_autoresponder_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        enabled: boolean("enabled").notNull(),
        match: varchar("match", { length: 4000 }).notNull(),
        wildcard: boolean("wildcard").notNull(),
        caseInsensitive: boolean("case_insensitive").notNull(),
        respondToBotsAndWebhooks: boolean("respond_to_bots_and_webhooks").notNull(),
        replyMode: mysqlEnum("reply_mode", ["none", "normal", "reply", "ping-reply"]).notNull(),
        reaction: varchar("reaction", { length: 20 }),
        message: json("message").notNull(),
        parsed: json("parsed").notNull(),
        bypassDefaultChannelSettings: boolean("bypass_default_channel_settings").notNull(),
        bypassDefaultRoleSettings: boolean("bypass_default_role_settings").notNull(),
        onlyInAllowedChannels: boolean("only_in_allowed_channels").notNull(),
        onlyToAllowedRoles: boolean("only_to_allowed_roles").notNull(),
        allowedChannels: text("allowed_channels").notNull(),
        allowedRoles: text("allowed_roles").notNull(),
        blockedChannels: text("blocked_channels").notNull(),
        blockedRoles: text("blocked_roles").notNull(),
    },
    (t) => ({
        idx_guild: index("idx_guild").on(t.guild),
    }),
);

export const guildModmailSettings = mysqlTable("guild_modmail_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    useMulti: boolean("use_multi").notNull(),
});

export const guildModmailItems = mysqlTable(
    "guild_modmail_items",
    {
        id: int("id").notNull().autoincrement().primaryKey(),
        guild: varchar("guild", { length: 20 }).notNull(),
        name: varchar("name", { length: 100 }).notNull(),
        description: varchar("description", { length: 100 }).notNull(),
        emoji: varchar("emoji", { length: 20 }),
        useThreads: boolean("use_threads").notNull(),
        channel: varchar("channel", { length: 20 }),
        category: varchar("category", { length: 20 }),
        pingRoles: text("ping_roles").notNull(),
        pingHere: boolean("ping_here").notNull(),
        accessRoles: text("access_roles").notNull(),
        openMessage: text("open_message").notNull(),
        closeMessage: text("close_message").notNull(),
        openParsed: json("open_parsed").notNull(),
        closeParsed: json("close_parsed").notNull(),
    },
    (t) => ({
        idx_guild: index("idx_guild").on(t.guild),
    }),
);

export const guildModmailSnippets = mysqlTable(
    "guild_modmail_snippets",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        name: varchar("name", { length: 100 }).notNull(),
        content: text("content").notNull(),
        parsed: json("parsed").notNull(),
    },
    (t) => ({
        idx_guild: index("idx_guild").on(t.guild),
    }),
);

export const guildTicketsItems = mysqlTable(
    "guild_tickets_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        id: bigint("id", { mode: "number" }).notNull(),
        name: varchar("name", { length: 128 }).notNull(),
        channel: varchar("channel", { length: 20 }),
        message: varchar("message", { length: 20 }),
        prompt: json("prompt").notNull(),
        useMulti: boolean("use_multi").notNull(),
        error: text("error"),
    },
    (t) => ({
        unq_guild_id: unique("unq_guild_id").on(t.guild, t.id),
    }),
);

export const guildTicketsTargets = mysqlTable(
    "guild_tickets_targets",
    {
        id: bigint("id", { mode: "number" }).notNull(),
        guild: varchar("guild", { length: 20 }).notNull(),
        promptId: bigint("prompt_id", { mode: "number" }).notNull(),
        name: varchar("name", { length: 128 }).notNull(),
        channel: varchar("channel", { length: 20 }),
        category: varchar("category", { length: 20 }),
        buttonLabel: varchar("button_label", { length: 80 }).notNull(),
        buttonColor: mysqlEnum("button_color", ["gray", "blue", "green", "red"]).notNull(),
        dropdownLabel: varchar("dropdown_label", { length: 100 }).notNull(),
        dropdownDescription: varchar("dropdown_description", { length: 100 }).notNull(),
        emoji: varchar("emoji", { length: 20 }),
        pingRoles: text("ping_roles").notNull(),
        pingHere: boolean("ping_here").notNull(),
        accessRoles: text("access_roles").notNull(),
        postCustomOpenMessage: boolean("post_custom_open_message").notNull(),
        customOpenMessage: json("custom_open_message").notNull(),
        customOpenParsed: json("custom_open_parsed").notNull(),
    },
    (t) => ({
        unq_guild_id: unique("unq_guild_id").on(t.guild, t.id),
    }),
);

export const guildNukeguardSettings = mysqlTable("guild_nukeguard_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    adminChannel: varchar("admin_channel", { length: 20 }),
    pingRoles: text("ping_roles").notNull(),
    pingHere: boolean("ping_here").notNull(),
    exemptedRoles: text("exempted_roles").notNull(),
    watchChannelsByDefault: boolean("watch_channels_by_default").notNull(),
    ignoredChannels: text("ignored_channels").notNull(),
    watchedChannels: text("watched_channels").notNull(),
    watchRolesByDefault: boolean("watch_roles_by_default").notNull(),
    ignoredRoles: text("ignored_roles").notNull(),
    watchedRoles: text("watched_roles").notNull(),
    watchEmoji: boolean("watch_emoji").notNull(),
    watchStickers: boolean("watch_stickers").notNull(),
    watchSounds: boolean("watch_sounds").notNull(),
    preventWebhookCreation: boolean("prevent_webhook_creation").notNull(),
    watchWebhookDeletion: boolean("watch_webhook_deletion").notNull(),
    enableRatelimit: boolean("enable_ratelimit").notNull(),
    ratelimitKicking: boolean("ratelimit_kicking").notNull(),
    ratelimitThreshold: int("ratelimit_threshold"),
    ratelimitTime: int("ratelimit_time"),
    restrictRolesLenient: boolean("restrict_roles_lenient").notNull(),
    restrictRolesByDefault: boolean("restrict_roles_by_default").notNull(),
    restrictRolesAllowedRoles: text("restrict_roles_allowed_roles").notNull(),
    restrictRolesBlockedRoles: text("restrict_roles_blocked_roles").notNull(),
});

export const guildSuggestionsSettings = mysqlTable("guild_suggestions_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    channel: varchar("channel", { length: 20 }),
    anon: boolean("anon").notNull(),
});

export const guildCoOpSettings = mysqlTable("guild_co_op_settings", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    wl0: varchar("wl0", { length: 20 }),
    wl1: varchar("wl1", { length: 20 }),
    wl2: varchar("wl2", { length: 20 }),
    wl3: varchar("wl3", { length: 20 }),
    wl4: varchar("wl4", { length: 20 }),
    wl5: varchar("wl5", { length: 20 }),
    wl6: varchar("wl6", { length: 20 }),
    wl7: varchar("wl7", { length: 20 }),
    wl8: varchar("wl8", { length: 20 }),
    regionNA: varchar("region_na", { length: 20 }),
    regionEU: varchar("region_eu", { length: 20 }),
    regionAS: varchar("region_as", { length: 20 }),
    regionSA: varchar("region_sa", { length: 20 }),
    helperNA: varchar("helper_na", { length: 20 }),
    helperEU: varchar("helper_eu", { length: 20 }),
    helperAS: varchar("helper_as", { length: 20 }),
    helperSA: varchar("helper_sa", { length: 20 }),
});

export const guildRedditFeedsItems = mysqlTable(
    "guild_reddit_feeds_items",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        subreddit: varchar("subreddit", { length: 32 }).notNull(),
        channel: varchar("channel", { length: 20 }),
    },
    (t) => ({
        idx_guild: index("idx_guild").on(t.guild),
    }),
);

export const guildCountItems = mysqlTable(
    "guild_count_items",
    {
        id: int("id").notNull().autoincrement().primaryKey(),
        guild: varchar("guild", { length: 20 }).notNull(),
        channel: varchar("channel", { length: 20 }).notNull(),
        interval: int("interval").notNull(),
        next: int("next").notNull(),
        allowDoubleCounting: boolean("allow_double_counting").notNull(),
    },
    (t) => ({
        idx_guild: index("idx_guild").on(t.guild),
        idx_channel: index("idx_channel").on(t.channel),
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

export const moderationRemovalTasks = mysqlTable(
    "moderation_removal_tasks",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        action: mysqlEnum("action", ["unmute", "unban"]).notNull(),
        time: bigint("time", { mode: "number" }).notNull(),
    },
    (t) => ({
        pk_guild_user_action: primaryKey({ name: "pk_guild_user_action", columns: [t.guild, t.user, t.action] }),
    }),
);

export const userHistory = mysqlTable(
    "user_history",
    {
        id: int("id").autoincrement().primaryKey(),
        guild: varchar("guild", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        type: mysqlEnum("type", ["ban", "kick", "timeout", "mute", "informal_warn", "warn", "bulk"]).notNull(),
        mod: varchar("mod", { length: 20 }).notNull(),
        time: timestamp("time")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        duration: int("duration"),
        origin: varchar("origin", { length: 128 }),
        reason: varchar("reason", { length: 512 }),
    },
    (t) => ({
        idx_guild_user: index("idx_guild_user").on(t.guild, t.user),
    }),
);

export const stickyRoles = mysqlTable(
    "sticky_roles",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        role: varchar("role", { length: 20 }).notNull(),
    },
    (t) => ({
        pk_guild_user_role: primaryKey({ name: "pk_guild_user_role", columns: [t.guild, t.user, t.role] }),
    }),
);

export const customRoles = mysqlTable(
    "custom_roles",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        role: varchar("role", { length: 20 }).notNull(),
    },
    (t) => ({
        pk_guild_user: primaryKey({ name: "pk_guild_user", columns: [t.guild, t.user] }),
    }),
);

export const modmailThreads = mysqlTable(
    "modmail_threads",
    {
        uuid: varchar("uuid", { length: 36 }).notNull(),
        channel: varchar("channel", { length: 20 }).notNull().primaryKey(),
        guild: varchar("guild", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        targetId: int("target_id").notNull(),
        closed: boolean("closed").notNull(),
    },
    (t) => ({
        unq_uuid: unique("unq_uuid").on(t.uuid),
        unq_guild_user_target: unique("unq_guild_user_target").on(t.guild, t.user, t.targetId),
    }),
);

export const modmailMessages = mysqlTable("modmail_messages", {
    uuid: varchar("uuid", { length: 36 }).notNull(),
    time: timestamp("time")
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    type: mysqlEnum("type", ["open", "incoming", "internal", "outgoing", "close"]),
    id: varchar("id", { length: 20 }).notNull(),
    source: varchar("source", { length: 36 }).notNull(),
    target: varchar("target", { length: 20 }).notNull(),
    author: varchar("author", { length: 20 }).notNull(),
    anon: boolean("anon").notNull(),
    targetName: varchar("target_name", { length: 100 }).notNull(),
    content: varchar("content", { length: 4000 }).notNull(),
    edits: json("edits").notNull(),
    attachments: json("attachments").notNull(),
    deleted: boolean("deleted").notNull(),
    sent: boolean("sent").notNull(),
});

export const modmailNotifications = mysqlTable(
    "modmail_notifications",
    {
        channel: varchar("channel", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        once: boolean("once").notNull(),
    },
    (t) => ({
        pk_channel_user: primaryKey({ name: "pk_channel_user", columns: [t.channel, t.user] }),
        idx_once: index("idx_once").on(t.once),
    }),
);

export const modmailAutoclose = mysqlTable("modmail_autoclose", {
    channel: varchar("channel", { length: 20 }).notNull().primaryKey(),
    guild: varchar("guild", { length: 20 }).notNull(),
    author: varchar("author", { length: 20 }).notNull(),
    notify: boolean("notify").notNull(),
    message: varchar("message", { length: 4000 }).notNull(),
    time: bigint("time", { mode: "number" }).notNull(),
});

export const files = mysqlTable("files", {
    uuid: varchar("uuid", { length: 36 }).notNull().primaryKey(),
    channel: varchar("channel", { length: 20 }).notNull(),
    message: varchar("message", { length: 20 }).notNull(),
});

export const tickets = mysqlTable(
    "tickets",
    {
        uuid: varchar("uuid", { length: 36 }).notNull().primaryKey(),
        guild: varchar("guild", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        prompt: bigint("prompt", { mode: "number" }).notNull(),
        target: bigint("target", { mode: "number" }).notNull(),
        closed: boolean("closed").notNull(),
        channel: varchar("channel", { length: 20 }).notNull(),
    },
    (t) => ({
        idx_guild_user_prompt_target: index("idx_guild_user_prompt_target").on(t.guild, t.user, t.prompt, t.target),
        idx_channel_closed: index("idx_channel_closed").on(t.channel, t.closed),
    }),
);

export const ticketMessages = mysqlTable(
    "ticket_messages",
    {
        uuid: varchar("uuid", { length: 36 }).notNull(),
        time: timestamp("time")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        type: mysqlEnum("type", ["open", "message", "close"]),
        id: varchar("id", { length: 20 }),
        author: varchar("author", { length: 20 }).notNull(),
        content: varchar("content", { length: 4000 }).notNull(),
        attachments: json("attachments").notNull(),
        edits: json("edits").notNull(),
        deleted: boolean("deleted").notNull(),
    },
    (t) => ({
        idx_uuid: index("idx_uuid").on(t.uuid),
    }),
);

export const suggestionIds = mysqlTable("suggestion_ids", {
    guild: varchar("guild", { length: 20 }).notNull().primaryKey(),
    id: int("id").notNull(),
});

export const suggestions = mysqlTable(
    "suggestions",
    {
        guild: varchar("guild", { length: 20 }).notNull(),
        id: int("id").notNull(),
        channel: varchar("channel", { length: 20 }).notNull(),
        message: varchar("message", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
    },
    (t) => ({
        pk_guild_id: primaryKey({ name: "pk_guild_id", columns: [t.guild, t.id] }),
    }),
);

export const suggestionVotes = mysqlTable(
    "suggestion_votes",
    {
        message: varchar("message", { length: 20 }).notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        yes: boolean("yes").notNull(),
    },
    (t) => ({
        pk_message_user: primaryKey({ name: "pk_message_user", columns: [t.message, t.user] }),
        idx_yes: index("idx_yes").on(t.yes),
    }),
);

export const countLast = mysqlTable("count_last", {
    id: int("id").notNull().primaryKey(),
    last: varchar("last", { length: 20 }),
});

export const countScoreboard = mysqlTable(
    "count_scoreboard",
    {
        id: int("id").notNull(),
        user: varchar("user", { length: 20 }).notNull(),
        score: int("score").notNull(),
    },
    (t) => ({
        pk_id_user: primaryKey({ name: "pk_id_user", columns: [t.id, t.user] }),
        idx_score: index("idx_score").on(t.score),
    }),
);
