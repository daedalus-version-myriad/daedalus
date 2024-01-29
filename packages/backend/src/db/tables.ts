import { sql } from "drizzle-orm";
import { boolean, index, int, mysqlEnum, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
