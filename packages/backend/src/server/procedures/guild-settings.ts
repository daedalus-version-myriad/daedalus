import { secrets } from "@daedalus/config";
import { parseMessage } from "@daedalus/custom-messages";
import { modules } from "@daedalus/data";
import { logCategories, logEvents } from "@daedalus/logging";
import type {
    GuildLoggingSettings,
    GuildModulesPermissionsSettings,
    GuildPremiumSettings,
    GuildSettings,
    GuildSupporterAnnouncementsSettings,
    GuildWelcomeSettings,
    GuildXpSettings,
    ParsedMessage,
} from "@daedalus/types";
import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { clients } from "../../bot";
import { tables } from "../../db";
import { db } from "../../db/db";
import { baseMessageData, snowflake } from "../schemas";
import { decodeArray } from "../transformations";
import { proc } from "../trpc";
import { isAdmin } from "./users";

export const NO_PERMISSION = "You do not have permission to manage settings within this guild.";

export async function isOwner(user: string | null, guildId: string) {
    if (!user) return false;
    if (user === secrets.OWNER) return true;

    const client = await clients.getBot(guildId);
    if (!client) return false;

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return false;

    return guild.ownerId === user;
}

export async function hasPermission(user: string | null, guildId: string) {
    if (!user) return false;
    if (user === secrets.OWNER) return true;

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
    enableModule: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake, module: z.string().max(32) }))
        .mutation(async ({ input: { id, guild, module } }) => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            await db
                .insert(tables.guildModulesSettings)
                .values({ guild, module, enabled: true })
                .onDuplicateKeyUpdate({ set: { enabled: true } });
        }),
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
                dashboardPermission: z.enum(["owner", "admin", "manager"], {
                    invalid_type_error: "Dashboard permission must be one of owner, admin, or manager.",
                    required_error: "Dashboard permission must be specified.",
                }),
                embedColor: z
                    .number()
                    .int("Embed color must be an integer.")
                    .min(0, "Embed color must not be negative.")
                    .max(0xffffff, "Embed color must not exceed #FFFFFF."),
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
    getModulesPermissionsSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildModulesPermissionsSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            const output: GuildModulesPermissionsSettings = { guild, modules: {}, commands: {} };

            for (const { guild: _, module, ...data } of await db.select().from(tables.guildModulesSettings).where(eq(tables.guildModulesSettings.guild, guild)))
                output.modules[module] = data;

            for (const { guild: _, command, ...data } of await db
                .select()
                .from(tables.guildCommandsSettings)
                .where(eq(tables.guildCommandsSettings.guild, guild)))
                output.commands[command] = {
                    ...data,
                    allowedRoles: decodeArray(data.allowedRoles),
                    blockedRoles: decodeArray(data.blockedRoles),
                    allowedChannels: decodeArray(data.allowedChannels),
                    blockedChannels: decodeArray(data.blockedChannels),
                };

            for (const [module, { default: enabled, commands }] of Object.entries(modules)) {
                output.modules[module] ??= { enabled: enabled ?? true };
                if (!commands) continue;

                for (const [command, data] of Object.entries(commands))
                    output.commands[command] ??= {
                        enabled: data.default ?? true,
                        ignoreDefaultPermissions: false,
                        allowedRoles: [],
                        blockedRoles: [],
                        restrictChannels: false,
                        allowedChannels: [],
                        blockedChannels: [],
                    };
            }

            return output;
        }),
    setModulesPermissionsSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                modules: z.record(z.string(), z.object({ enabled: z.boolean() })),
                commands: z.record(
                    z.string(),
                    z.object({
                        enabled: z.boolean(),
                        ignoreDefaultPermissions: z.boolean(),
                        allowedRoles: snowflake.array(),
                        blockedRoles: snowflake.array(),
                        restrictChannels: z.boolean(),
                        allowedChannels: snowflake.array(),
                        blockedChannels: snowflake.array(),
                    }),
                ),
            }),
        )
        .mutation(async ({ input: { id, guild, modules, commands } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            await db.transaction(async (tx) => {
                await tx.delete(tables.guildModulesSettings).where(eq(tables.guildModulesSettings.guild, guild));
                await tx.delete(tables.guildCommandsSettings).where(eq(tables.guildCommandsSettings.guild, guild));

                await tx.insert(tables.guildModulesSettings).values(Object.entries(modules).map(([module, entry]) => ({ guild, module, ...entry })));
                await tx.insert(tables.guildCommandsSettings).values(
                    Object.entries(commands).map(([command, entry]) => ({
                        guild,
                        command,
                        ...entry,
                        allowedRoles: entry.allowedRoles.join("/"),
                        blockedRoles: entry.blockedRoles.join("/"),
                        allowedChannels: entry.allowedChannels.join("/"),
                        blockedChannels: entry.blockedChannels.join("/"),
                    })),
                );
            });
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
                webhook: z.string().trim().max(128, "Webhooks should not be longer than 128 characters."),
                ignoredChannels: snowflake.array(),
                fileOnlyMode: z.boolean(),
                items: z.record(
                    z.string(),
                    z.object({ enabled: z.boolean(), useWebhook: z.boolean(), channel: snowflake.nullable(), webhook: z.string().trim().max(128) }),
                ),
            }),
        )
        .mutation(async ({ input: { id, guild, items, ignoredChannels, ...raw } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

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
    getWelcomeSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildWelcomeSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            const entry = (
                await db
                    .select({
                        guild: tables.guildWelcomeSettings.guild,
                        channel: tables.guildWelcomeSettings.channel,
                        message: tables.guildWelcomeSettings.message,
                    })
                    .from(tables.guildWelcomeSettings)
                    .where(eq(tables.guildWelcomeSettings.guild, guild))
            ).at(0);

            if (entry) return entry as GuildWelcomeSettings;

            return {
                guild,
                channel: null,
                message: { content: "", embeds: [] },
            };
        }),
    setWelcomeSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake, channel: snowflake.nullable(), message: baseMessageData }))
        .mutation(async ({ input: { id, guild, channel, message } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;
            let parsed: ParsedMessage;

            try {
                parsed = parseMessage(message, false);
            } catch (error) {
                return `${error}`;
            }

            const data = { channel, message, parsed };

            await db
                .insert(tables.guildWelcomeSettings)
                .values({ guild, ...data })
                .onDuplicateKeyUpdate({ set: data });
        }),
    getSupporterAnnouncementsSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildSupporterAnnouncementsSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            const entries = await db
                .select({
                    useBoosts: tables.guildSupporterAnnouncementsItems.useBoosts,
                    role: tables.guildSupporterAnnouncementsItems.role,
                    channel: tables.guildSupporterAnnouncementsItems.channel,
                    message: tables.guildSupporterAnnouncementsItems.message,
                })
                .from(tables.guildSupporterAnnouncementsItems)
                .where(eq(tables.guildSupporterAnnouncementsItems.guild, guild));

            return { guild, announcements: entries } as GuildSupporterAnnouncementsSettings;
        }),
    setSupporterAnnouncementsSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                announcements: z
                    .object({ useBoosts: z.boolean(), role: snowflake.nullable(), channel: snowflake.nullable(), message: baseMessageData })
                    .array(),
            }),
        )
        .mutation(async ({ input: { id, guild, announcements } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;
            let withParsed: (GuildSupporterAnnouncementsSettings["announcements"][number] & { guild: string; parsed: ParsedMessage })[];

            try {
                withParsed = await Promise.all(announcements.map((data) => ({ guild, ...data, parsed: parseMessage(data.message, false) })));
            } catch (error) {
                return `${error}`;
            }

            await db.transaction(async (tx) => {
                await tx.delete(tables.guildSupporterAnnouncementsItems).where(eq(tables.guildSupporterAnnouncementsItems.guild, guild));
                if (withParsed.length > 0) await tx.insert(tables.guildSupporterAnnouncementsItems).values(withParsed);
            });
        }),
    getXpSettings: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake })).query(async ({ input: { id, guild } }): Promise<GuildXpSettings> => {
        if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

        const entry = (await db.select().from(tables.guildXpSettings).where(eq(tables.guildXpSettings.guild, guild))).at(0) ?? {
            guild,
            blockedChannels: "",
            blockedRoles: "",
            bonusChannels: "",
            bonusRoles: "",
            rankCardBackground: "",
            announceLevelUp: false,
            announceInChannel: false,
            announceChannel: null,
            announcementBackground: "",
            rewards: "",
        };

        return {
            ...entry,
            guild,
            blockedChannels: decodeArray(entry.blockedChannels),
            blockedRoles: decodeArray(entry.blockedRoles),
            bonusChannels: decodeArray(entry.bonusChannels).map((s) => {
                const [id, num] = s.split(":");
                return { channel: id === "null" ? null : id, multiplier: num === "null" ? null : +num };
            }),
            bonusRoles: decodeArray(entry.bonusRoles).map((s) => {
                const [id, num] = s.split(":");
                return { role: id === "null" ? null : id, multiplier: num === "null" ? null : +num };
            }),
            rewards: decodeArray(entry.rewards).map((s) => {
                const [text, voice, role, removeOnHigher, dmOnReward] = s.split(":");
                return {
                    text: text === "null" ? null : +text,
                    voice: voice === "null" ? null : +voice,
                    role: role === "null" ? null : role,
                    removeOnHigher: removeOnHigher === "true",
                    dmOnReward: dmOnReward === "true",
                };
            }),
        };
    }),
    setXpSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                blockedChannels: snowflake.array(),
                blockedRoles: snowflake.array(),
                bonusChannels: z
                    .object({
                        channel: snowflake.nullable(),
                        multiplier: z
                            .number()
                            .min(0, "Bonus channel multipliers should be between 0 and 10.")
                            .max(10, "Bonus channel multipliers should be between 0 and 10.")
                            .nullable(),
                    })
                    .array(),
                bonusRoles: z
                    .object({
                        role: snowflake.nullable(),
                        multiplier: z
                            .number()
                            .min(0, "Bonus role multipliers should be between 0 and 10.")
                            .max(10, "Bonus role multipliers should be between 0 and 10.")
                            .nullable(),
                    })
                    .array(),
                rankCardBackground: z.string(),
                announceLevelUp: z.boolean(),
                announceInChannel: z.boolean(),
                announceChannel: snowflake.nullable(),
                announcementBackground: z.string(),
                rewards: z
                    .object({
                        text: z.number().int("Level reward levels must be integers.").min(1, "Level reward levels should be positive.").nullable(),
                        voice: z.number().int("Level reward levels must be integers.").min(1, "Level reward levels should be positive.").nullable(),
                        role: snowflake.nullable(),
                        removeOnHigher: z.boolean(),
                        dmOnReward: z.boolean(),
                    })
                    .array(),
            }),
        )
        .mutation(async ({ input: { id, guild, blockedChannels, blockedRoles, bonusChannels, bonusRoles, rewards, ...data } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            const toInsert = {
                ...data,
                blockedChannels: blockedChannels.join("/"),
                blockedRoles: blockedRoles.join("/"),
                bonusChannels: bonusChannels.map(({ channel, multiplier }) => `${channel}:${multiplier}`).join("/"),
                bonusRoles: bonusRoles.map(({ role, multiplier }) => `${role}:${multiplier}`).join("/"),
                rewards: rewards
                    .map(({ text, voice, role, removeOnHigher, dmOnReward }) => `${text}:${voice}:${role}:${removeOnHigher}:${dmOnReward}`)
                    .join("/"),
            };

            await db
                .insert(tables.guildXpSettings)
                .values({ guild, ...toInsert })
                .onDuplicateKeyUpdate({ set: toInsert });
        }),
} as const;
