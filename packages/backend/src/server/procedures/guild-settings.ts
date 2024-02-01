import { secrets } from "@daedalus/config";
import { modules } from "@daedalus/data";
import { logCategories, logEvents } from "@daedalus/logging";
import type {
    GuildLoggingSettings,
    GuildModulesPermissionsSettings,
    GuildPremiumSettings,
    GuildSettings,
    GuildWelcomeSettings,
    MessageData,
} from "@daedalus/types";
import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { clients } from "../../bot";
import { parseMessage } from "../../custom-messages";
import { tables } from "../../db";
import { db } from "../../db/db";
import { baseMessageData, snowflake } from "../schemas";
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
            let parsed: MessageData["parsed"];

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
} as const;
