import { secrets } from "@daedalus/config";
import { logCategories, logEvents } from "@daedalus/logging";
import type { GuildLoggingSettings, GuildPremiumSettings, GuildSettings } from "@daedalus/types";
import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { clients } from "../../bot";
import { tables } from "../../db";
import { db } from "../../db/db";
import { snowflake } from "../schemas";
import { decodeArray } from "../transformations";
import { proc } from "../trpc";
import { isAdmin } from "./users";

export const NO_PERMISSION = "You do not have permission to manage settings within this guild.";

export async function hasPermission(user: string | null, guildId: string) {
    if (!user) return false;

    const client = await clients.getBot(guildId);
    if (!client) return false;

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return false;

    if (await isAdmin(user)) return true;

    const member = await guild.members.fetch(user).catch(() => null);
    if (!member) return false;

    const threshold =
        (await db.select({ threshold: tables.guildSettings.dashboardPermission }).from(tables.guildSettings).where(eq(tables.guildSettings.guild, guildId))).at(
            0,
        )?.threshold ?? "manager";

    return threshold === "owner"
        ? user !== guild.ownerId
        : threshold === "admin"
          ? !member.permissions.has(PermissionFlagsBits.Administrator)
          : threshold === "manager"
            ? !member.permissions.has(PermissionFlagsBits.ManageGuild)
            : true;
}

export default {
    getSettings: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake })).query(async ({ input: { id, guild } }): Promise<GuildSettings> => {
        if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

        const data = (await db.select().from(tables.guildSettings).where(eq(tables.guildSettings.guild, guild))).at(0) ?? {
            guild,
            dashboardPermission: "manager",
            embedColor: 0x009688,
            muteRole: null,
            banFooter: "",
            modOnly: false,
            allowedRoles: "",
            blockedRoles: "",
            allowlistOnly: false,
            allowedChannels: "",
            blockedChannels: "",
        };

        return {
            ...data,
            allowedRoles: decodeArray(data.allowedRoles),
            blockedRoles: decodeArray(data.blockedRoles),
            allowedChannels: decodeArray(data.allowedChannels),
            blockedChannels: decodeArray(data.blockedChannels),
        };
    }),
    setSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                dashboardPermission: z.enum(["owner", "admin", "manager"]),
                embedColor: z.number().int().min(0).max(0xffffff),
                muteRole: snowflake.nullable(),
                banFooter: z.string().max(1024),
                modOnly: z.boolean(),
                allowedRoles: snowflake.array(),
                blockedRoles: snowflake.array(),
                allowlistOnly: z.boolean(),
                allowedChannels: snowflake.array(),
                blockedChannels: snowflake.array(),
            }),
        )
        .mutation(async ({ input: { id, guild, ...data } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            const mapped = {
                ...data,
                allowedRoles: data.allowedRoles.join("/"),
                blockedRoles: data.blockedRoles.join("/"),
                allowedChannels: data.allowedChannels.join("/"),
                blockedChannels: data.blockedChannels.join("/"),
            };

            await db
                .insert(tables.guildSettings)
                .values({ guild, ...mapped })
                .onDuplicateKeyUpdate({ set: mapped });
        }),
    getPremiumSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildPremiumSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            const client = await clients.getBot(guild);

            return {
                keys: await db
                    .select({ key: tables.premiumKeyBindings.key, disabled: tables.premiumKeys.disabled })
                    .from(tables.premiumKeyBindings)
                    .leftJoin(tables.premiumKeys, eq(tables.premiumKeyBindings.key, tables.premiumKeys.key))
                    .where(eq(tables.premiumKeyBindings.guild, guild)),
                usingCustom: client?.token !== secrets.DISCORD.TOKEN,
                tag: client?.user.tag ?? null,
                ...((await db.select().from(tables.guildPremiumSettings).where(eq(tables.guildPremiumSettings.guild, guild))).at(0) ?? {
                    guild,
                    hasPremium: false,
                    hasCustom: false,
                    status: "online",
                    activityType: "watching",
                    activity: "for /help",
                }),
            };
        }),
    getLoggingSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildLoggingSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            const rawBase = (await db.select().from(tables.guildLoggingSettings).where(eq(tables.guildLoggingSettings.guild, guild))).at(0) ?? {
                guild,
                useWebhook: false,
                channel: null,
                webhook: "",
                ignoredChannels: "",
                fileOnlyMode: false,
            };

            const base: GuildLoggingSettings = { ...rawBase, ignoredChannels: decodeArray(rawBase.ignoredChannels), items: {} };

            for (const { guild: _, key, ...data } of await db
                .select()
                .from(tables.guildLoggingSettingsItems)
                .where(eq(tables.guildLoggingSettingsItems.guild, guild))) {
                base.items[key] = data;
            }

            for (const key of Object.keys(logCategories)) base.items[key] ??= { enabled: false, useWebhook: false, channel: null, webhook: "" };
            for (const key of Object.keys(logEvents)) base.items[key] ??= { enabled: true, useWebhook: false, channel: null, webhook: "" };

            return base;
        }),
    setLoggingSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                useWebhook: z.boolean(),
                channel: snowflake.nullable(),
                webhook: z.string().trim().max(128),
                ignoredChannels: snowflake.array(),
                fileOnlyMode: z.boolean(),
                items: z.record(
                    z.string(),
                    z.object({ enabled: z.boolean(), useWebhook: z.boolean(), channel: snowflake.nullable(), webhook: z.string().trim().max(128) }),
                ),
            }),
        )
        .mutation(async ({ input: { id, guild, items, ignoredChannels, ...raw } }) => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            const data = { ...raw, ignoredChannels: ignoredChannels.join("/") };

            await db
                .insert(tables.guildLoggingSettings)
                .values({ guild, ...data })
                .onDuplicateKeyUpdate({ set: data });

            await db.transaction(async (tx) => {
                await tx.delete(tables.guildLoggingSettingsItems).where(eq(tables.guildLoggingSettingsItems.guild, guild));
                await tx.insert(tables.guildLoggingSettingsItems).values(Object.entries(items).map(([key, entry]) => ({ guild, key, ...entry })));
            });
        }),
} as const;
