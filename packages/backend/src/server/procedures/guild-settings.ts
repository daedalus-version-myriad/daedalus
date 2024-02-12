import { secrets } from "@daedalus/config";
import { parseCustomMessageString, parseMessage } from "@daedalus/custom-messages";
import { modules } from "@daedalus/data";
import { logCategories, logEvents } from "@daedalus/logging";
import type {
    CustomMessageText,
    GuildAutomodSettings,
    GuildAutoresponderSettings,
    GuildAutorolesSettings,
    GuildCustomRolesSettings,
    GuildLoggingSettings,
    GuildModmailSettings,
    GuildModulesPermissionsSettings,
    GuildPremiumSettings,
    GuildReactionRolesSettings,
    GuildSettings,
    GuildStarboardSettings,
    GuildStatsChannelsSettings,
    GuildStickyRolesSettings,
    GuildSupporterAnnouncementsSettings,
    GuildWelcomeSettings,
    GuildXpSettings,
    MessageData,
    ParsedMessage,
} from "@daedalus/types";
import { ButtonStyle, ComponentType, Message, PermissionFlagsBits, type BaseMessageOptions } from "discord.js";
import { and, eq, inArray, not } from "drizzle-orm";
import _ from "lodash";
import { z } from "zod";
import { triggerCustomRoleSweep } from "../../../../custom-roles/index";
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

export function transformXpSettings(data: {
    guild: string;
    blockedChannels: string;
    blockedRoles: string;
    bonusChannels: string;
    bonusRoles: string;
    rankCardBackground: string;
    announceLevelUp: boolean;
    announceInChannel: boolean;
    announceChannel: string | null;
    announcementBackground: string;
    rewards: string;
}): GuildXpSettings {
    return {
        ...data,
        guild: data.guild,
        blockedChannels: decodeArray(data.blockedChannels),
        blockedRoles: decodeArray(data.blockedRoles),
        bonusChannels: decodeArray(data.bonusChannels).map((s) => {
            const [id, num] = s.split(":");
            return { channel: id === "null" ? null : id, multiplier: num === "null" ? null : +num };
        }),
        bonusRoles: decodeArray(data.bonusRoles).map((s) => {
            const [id, num] = s.split(":");
            return { role: id === "null" ? null : id, multiplier: num === "null" ? null : +num };
        }),
        rewards: decodeArray(data.rewards).map((s) => {
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
}

export async function getXpSettings(guild: string): Promise<GuildXpSettings> {
    return transformXpSettings(
        (await db.select().from(tables.guildXpSettings).where(eq(tables.guildXpSettings.guild, guild))).at(0) ?? {
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
        },
    );
}

export async function getStarboardSettings(guild: string): Promise<GuildStarboardSettings> {
    const entry = (await db.select().from(tables.guildStarboardSettings).where(eq(tables.guildStarboardSettings.guild, guild))).at(0) ?? {
        guild,
        reaction: "⭐",
        channel: null,
        threshold: 5,
    };

    const overrides = await db
        .select({
            channel: tables.guildStarboardOverrides.channel,
            enabled: tables.guildStarboardOverrides.enabled,
            target: tables.guildStarboardOverrides.target,
            threshold: tables.guildStarboardOverrides.threshold,
        })
        .from(tables.guildStarboardOverrides)
        .where(eq(tables.guildStarboardOverrides.guild, guild));

    return { ...entry, overrides };
}

export async function getAutomodSettings(
    guild: string,
    limit?: number,
): Promise<Omit<GuildAutomodSettings, "rules"> & { rules: (GuildAutomodSettings["rules"][number] & { id: number })[] }> {
    const entry = (await db.select().from(tables.guildAutomodSettings).where(eq(tables.guildAutomodSettings.guild, guild))).at(0) ?? {
        guild,
        ignoredChannels: [],
        ignoredRoles: [],
        defaultChannel: null,
        interactWithWebhooks: false,
    };

    const query = db.select().from(tables.guildAutomodItems).where(eq(tables.guildAutomodItems.guild, guild));

    const rules = (await (limit ? query.limit(limit) : query)).map(({ guild, ...data }) => data as GuildAutomodSettings["rules"][number]);

    return { ...entry, rules } as any;
}

export async function getStickyRolesSettings(guild: string): Promise<GuildStickyRolesSettings> {
    const { roles } = (
        await db
            .select({ roles: tables.guildStickyRolesSettings.roles })
            .from(tables.guildStickyRolesSettings)
            .where(eq(tables.guildStickyRolesSettings.guild, guild))
    ).at(0) ?? {
        roles: "",
    };

    return { guild, roles: decodeArray(roles) };
}

export async function getAutorolesSettings(guild: string): Promise<GuildAutorolesSettings> {
    const { roles } = (
        await db
            .select({ roles: tables.guildAutorolesSettings.roles })
            .from(tables.guildAutorolesSettings)
            .where(eq(tables.guildAutorolesSettings.guild, guild))
    ).at(0) ?? {
        roles: "",
    };

    return { guild, roles: decodeArray(roles) };
}

export async function getCustomRolesSettings(guild: string): Promise<GuildCustomRolesSettings> {
    const { roles, ...data } = (await db.select().from(tables.guildCustomRolesSettings).where(eq(tables.guildCustomRolesSettings.guild, guild))).at(0) ?? {
        guild,
        allowBoosters: false,
        roles: "",
        anchor: null,
    };

    return { ...data, roles: decodeArray(roles) };
}

export async function getAutoresponderSettings(guild: string, limit?: number): Promise<GuildAutoresponderSettings> {
    const entry = (await db.select().from(tables.guildAutoresponderSettings).where(eq(tables.guildAutoresponderSettings.guild, guild))).at(0) ?? {
        guild,
        onlyInAllowedChannels: false,
        onlyToAllowedRoles: false,
        allowedChannels: "",
        allowedRoles: "",
        blockedChannels: "",
        blockedRoles: "",
    };

    const query = db.select().from(tables.guildAutoresponderItems).where(eq(tables.guildAutoresponderItems.guild, guild));

    const triggers = (await (limit ? query.limit(limit) : query)).map(
        ({
            guild,
            message,
            parsed,
            allowedChannels,
            allowedRoles,
            blockedChannels,
            blockedRoles,
            ...data
        }): GuildAutoresponderSettings["triggers"][number] => ({
            ...data,
            message: message as any,
            parsed: parsed as any,
            allowedChannels: decodeArray(allowedChannels),
            allowedRoles: decodeArray(allowedRoles),
            blockedChannels: decodeArray(blockedChannels),
            blockedRoles: decodeArray(blockedRoles),
        }),
    );

    return {
        ...entry,
        allowedChannels: decodeArray(entry.allowedChannels),
        allowedRoles: decodeArray(entry.allowedRoles),
        blockedChannels: decodeArray(entry.blockedChannels),
        blockedRoles: decodeArray(entry.blockedRoles),
        triggers,
    };
}

export async function getModmailSettings(guild: string): Promise<GuildModmailSettings> {
    const entry = (await db.select().from(tables.guildModmailSettings).where(eq(tables.guildModmailSettings.guild, guild))).at(0) ?? { guild, useMulti: false };

    const targets = (await db.select().from(tables.guildModmailItems).where(eq(tables.guildModmailItems.guild, guild))).map(
        ({ guild, pingRoles, accessRoles, openParsed, closeParsed, ...data }) => ({
            ...data,
            pingRoles: decodeArray(pingRoles),
            accessRoles: decodeArray(accessRoles),
            openParsed: openParsed as any,
            closeParsed: closeParsed as any,
        }),
    );

    return {
        ...entry,
        targets:
            targets.length === 0
                ? [
                      {
                          id: -1,
                          name: "Default Modmail Target",
                          description: "Remove/replace this description",
                          emoji: null,
                          useThreads: true,
                          channel: null,
                          category: null,
                          pingRoles: [],
                          pingHere: false,
                          accessRoles: [],
                          openMessage: "",
                          closeMessage: "",
                          openParsed: [],
                          closeParsed: [],
                      },
                  ]
                : targets,
        snippets: (await db.select().from(tables.guildModmailSnippets).where(eq(tables.guildModmailSnippets.guild, guild))).map(
            ({ guild, parsed, ...data }) => ({ ...data, parsed: parsed as any }),
        ),
    };
}

const buttonStyles = {
    gray: ButtonStyle.Secondary,
    blue: ButtonStyle.Primary,
    green: ButtonStyle.Success,
    red: ButtonStyle.Danger,
} as const;

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
        return await getXpSettings(guild);
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
    getReactionRolesSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildReactionRolesSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            const entries = await db.select().from(tables.guildReactionRolesItems).where(eq(tables.guildReactionRolesItems.guild, guild));

            return { guild, prompts: entries.map(({ guild: _, ...entry }) => entry as any) };
        }),
    setReactionRolesSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                prompts: z
                    .object({
                        id: z.number(),
                        name: z.string().max(128),
                        addToExisting: z.boolean(),
                        channel: snowflake.nullable(),
                        message: snowflake.nullable(),
                        url: z.string().max(128),
                        style: z.enum(["dropdown", "buttons", "reactions"]),
                        type: z.enum(["normal", "unique", "verify", "lock"]),
                        dropdownData: z
                            .object({
                                emoji: z.string().nullable(),
                                role: snowflake.nullable(),
                                label: z.string().trim().max(100),
                                description: z.string().trim().max(100),
                            })
                            .array()
                            .max(25),
                        buttonData: z
                            .object({
                                emoji: z.string().nullable(),
                                role: snowflake.nullable(),
                                color: z.enum(["gray", "blue", "green", "red"]),
                                label: z.string().trim().max(80),
                            })
                            .array()
                            .max(5)
                            .array()
                            .max(5),
                        reactionData: z.object({ emoji: z.string().nullable(), role: snowflake.nullable() }).array().max(20),
                        promptMessage: baseMessageData,
                        error: z.string().nullable(),
                    })
                    .array(),
            }),
        )
        .mutation(async ({ input: { id, guild, prompts } }): Promise<[string | null, GuildReactionRolesSettings]> => {
            if (!(await hasPermission(id, guild))) return [NO_PERMISSION, { guild, prompts }];

            let inc = 0;

            const entryMap = Object.fromEntries(
                (await db.select().from(tables.guildReactionRolesItems).where(eq(tables.guildReactionRolesItems.guild, guild))).map(({ guild: _, ...data }) => [
                    data.id,
                    data as GuildReactionRolesSettings["prompts"][number],
                ]),
            );

            const client = await clients.getBot(guild);
            const obj = await client?.guilds.fetch(guild);

            for (const prompt of prompts) {
                if (prompt.id === -1) prompt.id = Date.now() * 100 + Math.floor(Math.random() * (100 - inc)) + inc++;

                try {
                    if (!client)
                        throw "Could not load the client for this guild. If you are using a custom client, please make sure its token is valid. If not, please contact support.";
                    if (!obj) throw "Could not load this guild. Please make sure the bot is in the server.";
                    if (!prompt.addToExisting && !prompt.channel) throw "No channel was set for this prompt. It was still saved but cannot be posted.";

                    if (prompt.style === "reactions" || prompt.addToExisting) {
                        if (prompt.reactionData.length === 0) throw "At least one reaction is required.";
                        if (prompt.reactionData.some((x) => !x.emoji)) throw "All reactions' emoji must be specified.";
                        if (prompt.reactionData.some((x) => !x.role)) throw "All reactions' roles must be specified.";
                        if (new Set(prompt.reactionData.map((x) => x.emoji)).size < prompt.reactionData.length) throw "All reactions' emoji must be unique.";
                        if (new Set(prompt.reactionData.map((x) => x.role)).size < prompt.reactionData.length) throw "All reactions' roles must be unique.";
                    } else if (prompt.style === "dropdown") {
                        if (prompt.dropdownData.length === 0) throw "At least one dropdown option is required.";
                        if (prompt.dropdownData.some((x) => !x.label)) throw "All options must have a label.";
                        if (prompt.dropdownData.some((x) => !x.role)) throw "All options' roles must be specified.";
                        if (new Set(prompt.dropdownData.map((x) => x.role)).size < prompt.dropdownData.length) throw "All options' roles must be unique.";
                    } else if (prompt.style === "buttons") {
                        if (prompt.buttonData.length === 0) throw "At least one button row is required.";
                        if (prompt.buttonData.some((x) => x.length === 0)) throw "At least one button is required per row.";
                        if (prompt.buttonData.some((x) => x.some((x) => !x.emoji && !x.label))) throw "All buttons must have either an emoji or a label.";
                        if (prompt.buttonData.some((x) => x.some((x) => !x.role))) throw "All buttons' roles must be specified.";
                        if (
                            new Set(prompt.buttonData.flatMap((x) => x.map((x) => x.role))).size <
                            prompt.buttonData.map((x) => x.length).reduce((x, y) => x + y)
                        )
                            throw "All buttons' roles must be unique.";
                    }

                    if (prompt.addToExisting) {
                        const match = prompt.url.match(/(\d+)\/(\d+)\/(\d+)/);
                        if (!match) throw "Invalid message URL.";

                        const [, gid, cid, mid] = match;
                        if (gid !== guild) throw "Message URL must point to a message in this server.";

                        const channel = await obj.channels.fetch(cid).catch(() => null);
                        if (!channel?.isTextBased()) throw "Invalid message URL / channel cannot be accessed.";

                        const message = await channel.messages.fetch(mid).catch(() => null);
                        if (!message) throw "Invalid message URL (message does not exist in the channel).";

                        try {
                            for (const { emoji } of prompt.reactionData) if (emoji && !message.reactions.cache.has(emoji)) await message.react(emoji);
                        } catch {
                            throw "Adding reactions failed. Ensure all emoji exist and the bot has permission to use them.";
                        }

                        prompt.channel = channel.id;
                        prompt.message = message.id;
                    } else {
                        const data = (post: boolean): BaseMessageOptions => ({
                            ...(!post && prompt.id in entryMap && _.isEqual(prompt.promptMessage, entryMap[prompt.id].promptMessage)
                                ? {}
                                : prompt.promptMessage),
                            components:
                                prompt.style === "dropdown"
                                    ? [
                                          {
                                              type: ComponentType.ActionRow,
                                              components: [
                                                  {
                                                      type: ComponentType.StringSelect,
                                                      customId: "::reaction-roles/dropdown",
                                                      options: prompt.dropdownData.map((x, i) => ({
                                                          label: x.label,
                                                          value: `${i}`,
                                                          description: x.description || undefined,
                                                          emoji: x.emoji || undefined,
                                                      })),
                                                      minValues: prompt.type === "lock" ? 1 : 0,
                                                      maxValues: prompt.type === "unique" || prompt.type === "lock" ? 1 : prompt.dropdownData.length,
                                                  },
                                              ],
                                          },
                                      ]
                                    : prompt.style === "buttons"
                                      ? prompt.buttonData.map((row, ri) => ({
                                            type: ComponentType.ActionRow,
                                            components: row.map((x, i) => ({
                                                type: ComponentType.Button,
                                                style: buttonStyles[x.color],
                                                customId: `::reaction-roles/button:${ri}:${i}`,
                                                emoji: x.emoji || undefined,
                                                label: x.label || undefined,
                                            })),
                                        }))
                                      : [],
                        });

                        let message: Message | undefined;

                        const shouldPost = () =>
                            !_.isEqual(
                                ...([prompt, entryMap[prompt.id]].map((x) => [
                                    x.promptMessage,
                                    x.style,
                                    x.type,
                                    x.style === "dropdown"
                                        ? x.dropdownData.map((x) => ({ ...x, role: null }))
                                        : x.style === "buttons"
                                          ? x.buttonData.map((x) => x.map((x) => ({ ...x, role: null })))
                                          : null,
                                ]) as [any, any]),
                            );

                        if (prompt.id in entryMap) {
                            if (prompt.channel === entryMap[prompt.id].channel) {
                                const channel = await obj.channels.fetch(prompt.channel!).catch(() => null);
                                if (!channel?.isTextBased()) throw "Could not fetch channel.";

                                let edit = false;

                                try {
                                    message = await channel.messages.fetch({ message: entryMap[prompt.id].message!, force: true });
                                    edit = true;
                                } catch {
                                    message = await channel.send(data(true)).catch((error) => {
                                        throw `Could neither fetch the messaeg in #${channel.name} to edit nor send a new one: ${error}`;
                                    });
                                }

                                if (edit && shouldPost()) await message.edit(data(false));
                            } else {
                                try {
                                    const channel = await obj.channels.fetch(entryMap[prompt.id].channel!);
                                    if (!channel?.isTextBased()) throw 0;
                                    await (await channel.messages.fetch(entryMap[prompt.id].message!)).delete();
                                } catch {}
                            }
                        }

                        if (!message) {
                            const channel = await obj.channels.fetch(prompt.channel!).catch(() => null);
                            if (!channel?.isTextBased()) throw "Could not fetch channel.";

                            message = await channel.send(data(true)).catch(() => {
                                throw `Could not send message in #${channel.name}.`;
                            });
                        }

                        prompt.message = message.id;

                        if (prompt.style === "reactions")
                            try {
                                for (const { emoji } of prompt.reactionData) if (emoji && !message.reactions.cache.has(emoji!)) await message.react(emoji);
                            } catch {
                                throw "Adding reactions failed. Ensure all emoji exist and the bot has permission to use them.";
                            }
                    }

                    prompt.error = null;
                } catch (error) {
                    if (typeof error !== "string") console.error(error);
                    prompt.error = `${error}`;
                }
            }

            if (obj)
                for (const entry of Object.values(entryMap))
                    if (!entry.addToExisting && !prompts.some((prompt) => prompt.id === entry.id))
                        try {
                            const channel = await obj?.channels.fetch(entry.channel!);
                            if (!channel?.isTextBased()) throw 0;
                            await (await channel.messages.fetch(entry.message!)).delete();
                        } catch {}

            await db.transaction(async (tx) => {
                await tx.delete(tables.guildReactionRolesItems).where(eq(tables.guildReactionRolesItems.guild, guild));
                if (prompts.length > 0) await tx.insert(tables.guildReactionRolesItems).values(prompts.map((prompt) => ({ guild, ...prompt })));
            });

            return [null, { guild, prompts }];
        }),
    getStarboardSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildStarboardSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;
            return await getStarboardSettings(guild);
        }),
    setStarboardSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                reaction: z.string().nullable(),
                channel: snowflake.nullable(),
                threshold: z.number().int().min(2, "The starboard threshold must be at least 2."),
                overrides: z
                    .object({
                        channel: snowflake.nullable(),
                        enabled: z.boolean(),
                        target: snowflake.nullable(),
                        threshold: z.number().int().min(2, "Starboard override thresholds must be at least 2.").nullable(),
                    })
                    .array(),
            }),
        )
        .mutation(async ({ input: { id, guild, overrides, ...data } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;
            if (overrides.some((x) => x.channel === null)) return "All overrides must specify the channel on the left side.";

            await db.transaction(async (tx) => {
                await tx
                    .insert(tables.guildStarboardSettings)
                    .values({ guild, ...data })
                    .onDuplicateKeyUpdate({ set: data });

                await tx.delete(tables.guildStarboardOverrides).where(eq(tables.guildStarboardOverrides.guild, guild));
                if (overrides.length > 0) await tx.insert(tables.guildStarboardOverrides).values(overrides.map((x) => ({ guild, ...x, channel: x.channel! })));
            });
        }),
    getAutomodSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildAutomodSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;
            const settings = await getAutomodSettings(guild);

            return { ...settings, rules: settings.rules.map(({ id, ...x }) => x) };
        }),
    setAutomodSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                ignoredChannels: snowflake.array(),
                ignoredRoles: snowflake.array(),
                defaultChannel: snowflake.nullable(),
                interactWithWebhooks: z.boolean(),
                rules: z
                    .object({
                        enable: z.boolean(),
                        name: z.string().trim().max(128),
                        type: z.enum([
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
                        ]),
                        blockedTermsData: z.object({
                            terms: z
                                .array(
                                    z
                                        .string()
                                        .regex(
                                            /^(\*\S|[^*]).{3,}(\S\*|[^*])$/,
                                            "Blocked terms must be at least three characters and wildcards must not be next to spaces.",
                                        ),
                                )
                                .max(1000),
                        }),
                        blockedStickersData: z.object({ ids: snowflake.array().max(1000) }),
                        capsSpamData: z.object({
                            ratioLimit: z.number().min(40, "Caps spam ratio limit must be at least 40.").max(100, "Caps spam ratio limit must be at most 100."),
                            limit: z.number().min(1, "Caps spam flat limit must be at least 1."),
                        }),
                        newlineSpamData: z.object({
                            consecutiveLimit: z.number().min(1, "Newline spam consecutive limit must be at least 1."),
                            totalLimit: z.number().min(1, "Newline spam total limit must be at least 1."),
                        }),
                        repeatedCharactersData: z.object({ consecutiveLimit: z.number().min(2, "Repeated character limit must be at least 2.") }),
                        lengthLimitData: z.object({ limit: z.number().min(2, "Length limit must be at least 2.") }),
                        emojiSpamData: z.object({ limit: z.number().min(2, "Emoji spam limit must be at least 2."), blockAnimatedEmoji: z.boolean() }),
                        ratelimitData: z.object({
                            threshold: z.number().min(2, "Ratelimit threshold must be at least 2."),
                            timeInSeconds: z.number().min(1, "Ratelimit timespan must be at least 1 second."),
                        }),
                        attachmentSpamData: z.object({
                            threshold: z.number().min(2, "Attachment spam threshold must be at least 2."),
                            timeInSeconds: z.number().min(1, "Attachment spam timespan must be at least 1 second."),
                        }),
                        stickerSpamData: z.object({
                            threshold: z.number().min(2, "Sticker spam threshold must be at least 2."),
                            timeInSeconds: z.number().min(1, "Sticker spam timespan must be at least 1 second."),
                        }),
                        linkSpamData: z.object({
                            threshold: z.number().min(2, "Link spam threshold must be at least 2."),
                            timeInSeconds: z.number().min(1, "Link spam timespan must be at least 1 second."),
                        }),
                        inviteLinksData: z.object({ blockUnknown: z.boolean(), allowed: snowflake.array().max(1000), blocked: snowflake.array().max(1000) }),
                        linkBlocklistData: z.object({
                            websites: z
                                .array(
                                    z
                                        .string()
                                        .regex(
                                            /^(?<!\w+:\/\/).+\../,
                                            "At least one blocklisted website in a link blocklist rule was invalid (schema was included or the input did not resemble a URL component).",
                                        ),
                                )
                                .max(1000),
                        }),
                        mentionSpamData: z.object({
                            perMessageLimit: z.number().min(2, "Mention spam per-message limit must be at least 2."),
                            totalLimit: z.number().min(1, "Mention spam total limit must be at least 1."),
                            timeInSeconds: z.number().min(1, "Mention spam timespan must be at least 1 second."),
                            blockFailedEveryoneOrHere: z.boolean(),
                        }),
                        reportToChannel: z.boolean(),
                        deleteMessage: z.boolean(),
                        notifyAuthor: z.boolean(),
                        reportChannel: snowflake.nullable(),
                        additionalAction: z.enum(["nothing", "warn", "mute", "timeout", "kick", "ban"]),
                        actionDuration: z.number().int().min(0, "Additional action duration cannot be negative."),
                        disregardDefaultIgnoredChannels: z.boolean(),
                        disregardDefaultIgnoredRoles: z.boolean(),
                        onlyWatchEnabledChannels: z.boolean(),
                        onlyWatchEnabledRoles: z.boolean(),
                        ignoredChannels: snowflake.array(),
                        ignoredRoles: snowflake.array(),
                        watchedChannels: snowflake.array(),
                        watchedRoles: snowflake.array(),
                    })
                    .array(),
            }),
        )
        .mutation(async ({ input: { id, guild, rules, ...data } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            for (const rule of rules) {
                try {
                    if (rule.type === "blocked-terms") {
                        if (rule.blockedTermsData.terms.some((x) => x.match(/^\*\s|\s\*$/) || x.replace(/^\*?\s*|\s*\*?$/g, "").length < 3))
                            throw `Terms must be at least 3 characters long (not counting wildcard) and wildcards must not be adjacent to whitespace.`;
                        if (rule.blockedTermsData.terms.length > 1000) throw `Maximum 1000 terms allowed`;
                    } else if (rule.type === "blocked-stickers") {
                        if (rule.blockedStickersData.ids.some((x) => !x.match(/^[1-9][0-9]{16,19}$/))) throw `IDs must be Discord IDs (17-20 digit numbers))`;
                        if (rule.blockedStickersData.ids.length > 1000) throw `Maximum 1000 stickers allowed`;
                    } else if (rule.type === "invite-links") {
                        if ([...rule.inviteLinksData.allowed, ...rule.inviteLinksData.blocked].some((x) => !x.match(/^[1-9][0-9]{16,19}$/)))
                            throw `IDs must be Discord IDs (17-20 digit numbers))`;
                        if (rule.inviteLinksData.allowed.length > 1000 || rule.inviteLinksData.blocked.length > 1000) throw `Maximum 1000 servers allowed`;
                    } else if (rule.type === "link-blocklist") {
                        if (rule.linkBlocklistData.websites.some((x) => x.match(/^\w+:\/\//) || !x.match(/.\../)))
                            throw `Links should not contain the schema and should be valid URL components`;
                        if (rule.linkBlocklistData.websites.length > 1000) throw `Maximum 1000 links allowed.`;
                    }

                    if (rule.additionalAction === "timeout" && rule.actionDuration > 28 * 24 * 60 * 60 * 1000)
                        throw `Members can only be timed out for up to 28 days`;
                } catch (error) {
                    return `Error in ${rule.name}: ${error}`;
                }
            }

            await db.transaction(async (tx): Promise<void> => {
                await tx
                    .insert(tables.guildAutomodSettings)
                    .values({ guild, ...data })
                    .onDuplicateKeyUpdate({ set: data });

                await tx.delete(tables.guildAutomodItems).where(eq(tables.guildAutomodItems.guild, guild));
                if (rules.length > 0) await tx.insert(tables.guildAutomodItems).values(rules.map((rule) => ({ guild, ...rule })));
            });
        }),
    getStickyRolesSettings: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake })).query(async ({ input: { id, guild } }) => {
        if (!(await hasPermission(id, guild))) throw NO_PERMISSION;
        return await getStickyRolesSettings(guild);
    }),
    setStickyRolesSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake, roles: snowflake.array() }))
        .mutation(async ({ input: { id, guild, roles: array } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            const roles = array.join("/");

            await db.insert(tables.guildStickyRolesSettings).values({ guild, roles }).onDuplicateKeyUpdate({ set: { roles } });
        }),
    getAutorolesSettings: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake })).query(async ({ input: { id, guild } }) => {
        if (!(await hasPermission(id, guild))) throw NO_PERMISSION;
        return await getAutorolesSettings(guild);
    }),
    setAutorolesSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake, roles: snowflake.array() }))
        .mutation(async ({ input: { id, guild, roles: array } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            const roles = array.join("/");

            await db.insert(tables.guildAutorolesSettings).values({ guild, roles }).onDuplicateKeyUpdate({ set: { roles } });
        }),
    getCustomRolesSettings: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake })).query(async ({ input: { id, guild } }) => {
        if (!(await hasPermission(id, guild))) throw NO_PERMISSION;
        return await getCustomRolesSettings(guild);
    }),
    setCustomRolesSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake, allowBoosters: z.boolean(), roles: snowflake.array(), anchor: snowflake.nullable() }))
        .mutation(async ({ input: { id, guild, roles, ...rest } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            const data = { ...rest, roles: roles.join("/") };

            await db
                .insert(tables.guildCustomRolesSettings)
                .values({ guild, ...data })
                .onDuplicateKeyUpdate({ set: data });

            await triggerCustomRoleSweep(guild).catch(() => null);
        }),
    getStatsChannelsSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake }))
        .query(async ({ input: { id, guild } }): Promise<GuildStatsChannelsSettings> => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            return {
                guild,
                channels: await db
                    .select({ channel: tables.guildStatsChannelsItems.channel, format: tables.guildStatsChannelsItems.format })
                    .from(tables.guildStatsChannelsItems)
                    .where(eq(tables.guildStatsChannelsItems.guild, guild)),
            };
        }),
    setStatsChannelsSettings: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake, channels: z.object({ channel: snowflake.nullable(), format: z.string() }).array() }))
        .mutation(async ({ input: { id, guild, channels } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;
            if (channels.some((x) => !x.channel)) return "All stats channels must have a channel set on the left side.";
            if (new Set(channels.map((x) => x.channel)).size < channels.length)
                return "Each channel can only have one stats channel format string bound to it.";

            const data: { guild: string; channel: string; format: string; parsed: CustomMessageText }[] = [];

            for (let i = 0; i < channels.length; i++) {
                const { channel, format } = channels[i];

                try {
                    const parsed = parseCustomMessageString(format);
                    data.push({ guild, channel: channel!, format, parsed });
                } catch (error) {
                    return `An error occurred parsing entry #${i + 1}: ${error}`;
                }
            }

            await db.transaction(async (tx) => {
                await tx.delete(tables.guildStatsChannelsItems).where(eq(tables.guildStatsChannelsItems.guild, guild));
                if (channels.length > 0) await tx.insert(tables.guildStatsChannelsItems).values(data);
            });
        }),
    getAutoresponderSettings: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake })).query(async ({ input: { id, guild } }) => {
        if (!(await hasPermission(id, guild))) throw NO_PERMISSION;
        return await getAutoresponderSettings(guild);
    }),
    setAutoresponderSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                onlyInAllowedChannels: z.boolean(),
                onlyToAllowedRoles: z.boolean(),
                allowedChannels: snowflake.array(),
                allowedRoles: snowflake.array(),
                blockedChannels: snowflake.array(),
                blockedRoles: snowflake.array(),
                triggers: z
                    .object({
                        enabled: z.boolean(),
                        match: z.string().max(4000),
                        wildcard: z.boolean(),
                        caseInsensitive: z.boolean(),
                        respondToBotsAndWebhooks: z.boolean(),
                        replyMode: z.enum(["none", "normal", "reply", "ping-reply"]),
                        reaction: z.string().nullable(),
                        message: baseMessageData,
                        parsed: z.any(),
                        bypassDefaultChannelSettings: z.boolean(),
                        bypassDefaultRoleSettings: z.boolean(),
                        onlyInAllowedChannels: z.boolean(),
                        onlyToAllowedRoles: z.boolean(),
                        allowedChannels: snowflake.array(),
                        allowedRoles: snowflake.array(),
                        blockedChannels: snowflake.array(),
                        blockedRoles: snowflake.array(),
                    })
                    .array(),
            }),
        )
        .mutation(async ({ input: { id, guild, triggers, ...data } }) => {
            if (!(await hasPermission(id, guild))) return NO_PERMISSION;

            for (const trigger of triggers)
                try {
                    trigger.parsed = parseMessage(trigger.message as MessageData, false);
                } catch (error) {
                    return `Error parsing custom message for trigger matching ${trigger.match}: ${error}`;
                }

            await db.transaction(async (tx) => {
                const values = {
                    ...data,
                    allowedChannels: data.allowedChannels.join("/"),
                    allowedRoles: data.allowedRoles.join("/"),
                    blockedChannels: data.blockedChannels.join("/"),
                    blockedRoles: data.blockedRoles.join("/"),
                };

                await tx
                    .insert(tables.guildAutoresponderSettings)
                    .values({ guild, ...values })
                    .onDuplicateKeyUpdate({ set: values });

                await tx.delete(tables.guildAutoresponderItems).where(eq(tables.guildAutoresponderItems.guild, guild));

                if (triggers.length > 0)
                    await tx.insert(tables.guildAutoresponderItems).values(
                        triggers.map(({ allowedChannels, allowedRoles, blockedChannels, blockedRoles, parsed, ...data }) => ({
                            guild,
                            ...data,
                            allowedChannels: allowedChannels.join("/"),
                            allowedRoles: allowedRoles.join("/"),
                            blockedChannels: blockedChannels.join("/"),
                            blockedRoles: blockedRoles.join("/"),
                            parsed: parsed!,
                        })),
                    );
            });
        }),
    getModmailSettings: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake })).query(async ({ input: { id, guild } }) => {
        if (!(await hasPermission(id, guild))) throw NO_PERMISSION;
        return await getModmailSettings(guild);
    }),
    setModmailSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                useMulti: z.boolean(),
                targets: z
                    .object({
                        id: z.number(),
                        name: z.string().max(100),
                        description: z.string().max(100),
                        emoji: z.string().max(20).nullable(),
                        useThreads: z.boolean(),
                        channel: snowflake.nullable(),
                        category: snowflake.nullable(),
                        pingRoles: snowflake.array(),
                        pingHere: z.boolean(),
                        accessRoles: snowflake.array(),
                        openMessage: z.string(),
                        closeMessage: z.string(),
                        openParsed: z.any(),
                        closeParsed: z.any(),
                    })
                    .array(),
                snippets: z
                    .object({
                        name: z.string().max(100),
                        content: z.string(),
                        parsed: z.any(),
                    })
                    .array(),
            }),
        )
        .mutation(async ({ input: { id, guild, useMulti, targets, snippets } }): Promise<[string | null, GuildModmailSettings]> => {
            const result = { useMulti, targets, snippets } as GuildModmailSettings;
            if (!(await hasPermission(id, guild))) return [NO_PERMISSION, result];

            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];

                try {
                    target.openParsed = parseCustomMessageString(target.openMessage);
                    target.closeParsed = parseCustomMessageString(target.closeMessage);
                } catch (error) {
                    return [
                        `Error parsing open/close message${useMulti || i > 0 ? ` for modmail target #${i + 1}${useMulti ? "" : ` (although multi-target mode is off, to ensure no future issues, please fix or remove this modmail target)`}` : ""}: ${error}`,
                        result,
                    ];
                }
            }

            for (const snippet of snippets)
                try {
                    snippet.parsed = parseCustomMessageString(snippet.content);
                } catch (error) {
                    return [`Error parsing snippet named ${snippet.name}: ${error}`, result];
                }

            await db.transaction(async (tx) => {
                await tx.insert(tables.guildModmailSettings).values({ guild, useMulti }).onDuplicateKeyUpdate({ set: { useMulti } });

                if (targets.length > 0)
                    await tx.delete(tables.guildModmailItems).where(
                        and(
                            eq(tables.guildModmailItems.guild, guild),
                            not(
                                inArray(
                                    tables.guildModmailItems.id,
                                    targets.map((t) => t.id),
                                ),
                            ),
                        ),
                    );
                else await tx.delete(tables.guildModmailItems).where(eq(tables.guildModmailItems.guild, guild));

                for (const { id, pingRoles, accessRoles, openParsed, closeParsed, ...target } of targets) {
                    const data = {
                        guild,
                        ...target,
                        pingRoles: pingRoles.join("/"),
                        accessRoles: accessRoles.join("/"),
                        openParsed: openParsed!,
                        closeParsed: closeParsed!,
                    };

                    if (id === -1) await tx.insert(tables.guildModmailItems).values(data);
                    else {
                        const { rowsAffected } = await tx
                            .update(tables.guildModmailItems)
                            .set(data)
                            .where(and(eq(tables.guildModmailItems.id, id), eq(tables.guildModmailItems.guild, guild)));

                        if (rowsAffected === 0) await tx.insert(tables.guildModmailItems).values(data);
                    }
                }

                await tx.delete(tables.guildModmailSnippets).where(eq(tables.guildModmailSnippets.guild, guild));
                if (snippets.length > 0)
                    await tx.insert(tables.guildModmailSnippets).values(snippets.map(({ parsed, ...snippet }) => ({ guild, ...snippet, parsed: parsed! })));
            });

            return [null, await getModmailSettings(guild)];
        }),
} as const;
