import { sql } from "drizzle-orm";
import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
    blockedRoles: text("allowed_roles").notNull().default(""),
    allowlistOnly: boolean("allowlist_only").notNull().default(false),
    allowedChannels: text("allowed_channels").notNull().default(""),
    blockedChannels: text("blocked_channels").notNull().default(""),
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
