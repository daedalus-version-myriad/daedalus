import { commandMap, modules, type PremiumBenefits } from "@daedalus/data";
import { logEvents } from "@daedalus/logging";
import type { ParsedMessage } from "@daedalus/types";
import { and, desc, eq, gt, inArray, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { snowflake } from "../schemas";
import { decodeArray } from "../transformations";
import { proc } from "../trpc";
import { getXpSettings, transformXpSettings } from "./guild-settings";
import { getLimit } from "./premium";

export default {
    getColor: proc.input(snowflake).query(async ({ input: guild }) => {
        const [entry] = await db.select({ color: tables.guildSettings.embedColor }).from(tables.guildSettings).where(eq(tables.guildSettings.guild, guild));
        return entry?.color ?? 0x009688;
    }),
    getMuteRole: proc.input(snowflake).query(async ({ input: guild }) => {
        const [entry] = await db.select({ id: tables.guildSettings.muteRole }).from(tables.guildSettings).where(eq(tables.guildSettings.guild, guild));
        return entry?.id ?? null;
    }),
    getFileOnlyMode: proc.input(snowflake).query(async ({ input: guild }) => {
        const [entry] = await db
            .select({ fileOnlyMode: tables.guildLoggingSettings.fileOnlyMode })
            .from(tables.guildLoggingSettings)
            .where(eq(tables.guildLoggingSettings.guild, guild));

        return entry?.fileOnlyMode ?? false;
    }),
    isModuleEnabled: proc.input(z.object({ guild: snowflake, module: z.string() })).query(async ({ input: { guild, module } }) => {
        const [entry] = await db
            .select({ enabled: tables.guildModulesSettings.enabled })
            .from(tables.guildModulesSettings)
            .where(and(eq(tables.guildModulesSettings.guild, guild), eq(tables.guildModulesSettings.module, module)));

        if (!entry) return modules[module].default ?? true;
        return entry.enabled;
    }),
    getGlobalCommandSettings: proc.input(snowflake).query(async ({ input: guild }) => {
        const entry = (
            await db
                .select({
                    modOnly: tables.guildSettings.modOnly,
                    allowedRoles: tables.guildSettings.allowedRoles,
                    blockedRoles: tables.guildSettings.blockedRoles,
                    allowlistOnly: tables.guildSettings.allowlistOnly,
                    allowedChannels: tables.guildSettings.allowedChannels,
                    blockedChannels: tables.guildSettings.blockedChannels,
                })
                .from(tables.guildSettings)
                .where(eq(tables.guildSettings.guild, guild))
        ).at(0) ?? {
            modOnly: false,
            allowedRoles: "",
            blockedRoles: "",
            allowlistOnly: false,
            allowedChannels: "",
            blockedChannels: "",
        };

        return {
            modOnly: entry.modOnly,
            allowedRoles: decodeArray(entry.allowedRoles),
            blockedRoles: decodeArray(entry.blockedRoles),
            allowlistOnly: entry.allowlistOnly,
            allowedChannels: decodeArray(entry.allowedChannels),
            blockedChannels: decodeArray(entry.blockedChannels),
        };
    }),
    getCommandPermissionSettings: proc.input(z.object({ guild: snowflake, command: z.string() })).query(async ({ input: { guild, command } }) => {
        const entry = (
            await db
                .select()
                .from(tables.guildCommandsSettings)
                .where(and(eq(tables.guildCommandsSettings.guild, guild), eq(tables.guildCommandsSettings.command, command)))
        ).at(0) ?? {
            enabled: commandMap[command].default ?? true,
            ignoreDefaultPermissions: false,
            allowedRoles: "",
            blockedRoles: "",
            restrictChannels: false,
            allowedChannels: "",
            blockedChannels: "",
        };

        return {
            enabled: entry.enabled,
            ignoreDefaultPermissions: entry.ignoreDefaultPermissions,
            allowedRoles: decodeArray(entry.allowedRoles),
            blockedRoles: decodeArray(entry.blockedRoles),
            restrictChannels: entry.restrictChannels,
            allowedChannels: decodeArray(entry.allowedChannels),
            blockedChannels: decodeArray(entry.blockedChannels),
        };
    }),
    obtainLimit: proc
        .input(z.object({ guild: snowflake, key: z.string() }) as z.ZodType<{ guild: string; key: keyof PremiumBenefits }>)
        .query(async ({ input: { guild, key } }) => {
            return await getLimit(guild, key);
        }),
    getXpAmount: proc
        .input(z.object({ guild: snowflake, user: snowflake }))
        .query(async ({ input: { guild, user } }): Promise<Record<"daily" | "weekly" | "monthly" | "total", { text: number; voice: number }>> => {
            const entry = (
                await db
                    .select()
                    .from(tables.xp)
                    .where(and(eq(tables.xp.guild, guild), eq(tables.xp.user, user)))
            ).at(0);

            if (!entry) return { daily: { text: 0, voice: 0 }, weekly: { text: 0, voice: 0 }, monthly: { text: 0, voice: 0 }, total: { text: 0, voice: 0 } };

            return {
                daily: {
                    text: entry.textDaily,
                    voice: entry.voiceDaily,
                },
                weekly: {
                    text: entry.textWeekly,
                    voice: entry.voiceWeekly,
                },
                monthly: {
                    text: entry.textMonthly,
                    voice: entry.voiceMonthly,
                },
                total: {
                    text: entry.textTotal,
                    voice: entry.voiceTotal,
                },
            };
        }),
    getXpRank: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        const { text, voice } = (
            await db
                .select({ text: tables.xp.textTotal, voice: tables.xp.voiceTotal })
                .from(tables.xp)
                .where(and(eq(tables.xp.guild, guild), eq(tables.xp.user, user)))
        ).at(0) ?? { text: 0, voice: 0 };

        const [{ count: textRank }] = await db
            .select({ count: sql<number>`COUNT(*) + 1` })
            .from(tables.xp)
            .where(and(eq(tables.xp.guild, guild), ne(tables.xp.user, user), gt(tables.xp.textTotal, text)));

        const [{ count: voiceRank }] = await db
            .select({ count: sql<number>`COUNT(*) + 1` })
            .from(tables.xp)
            .where(and(eq(tables.xp.guild, guild), ne(tables.xp.user, user), gt(tables.xp.voiceTotal, voice)));

        return { text, voice, textRank, voiceRank };
    }),
    getXpSize: proc.input(snowflake).query(async ({ input: guild }) => {
        const [{ count }] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(tables.xp)
            .where(eq(tables.xp.guild, guild));

        return count;
    }),
    getXpTop: proc
        .input(
            z.object({
                guild: snowflake,
                key: z.enum(["textDaily", "textWeekly", "textMonthly", "textTotal", "voiceDaily", "voiceWeekly", "voiceMonthly", "voiceTotal"]),
                page: z.number().int().min(1),
                limit: z.number().int().min(1),
            }),
        )
        .query(async ({ input: { guild, key, page, limit } }) => {
            return await db
                .select({ user: tables.xp.user, amount: tables.xp[key] })
                .from(tables.xp)
                .where(eq(tables.xp.guild, guild))
                .orderBy(desc(tables.xp[key]))
                .offset((page - 1) * limit)
                .limit(limit);
        }),
    increaseXp: proc
        .input(z.object({ guild: snowflake, user: snowflake, text: z.number().optional().default(0), voice: z.number().optional().default(0) }))
        .mutation(async ({ input: { guild, user, text, voice } }) => {
            await db
                .insert(tables.xp)
                .values({
                    guild,
                    user,
                    textDaily: text,
                    textWeekly: text,
                    textMonthly: text,
                    textTotal: text,
                    voiceDaily: voice,
                    voiceWeekly: voice,
                    voiceMonthly: voice,
                    voiceTotal: voice,
                })
                .onDuplicateKeyUpdate({
                    set: {
                        textDaily: sql`text_daily + ${text}`,
                        textWeekly: sql`text_weekly + ${text}`,
                        textMonthly: sql`text_monthly + ${text}`,
                        textTotal: sql`text_total + ${text}`,
                        voiceDaily: sql`voice_daily + ${voice}`,
                        voiceWeekly: sql`voice_weekly + ${voice}`,
                        voiceMonthly: sql`voice_monthly + ${voice}`,
                        voiceTotal: sql`voice_total + ${voice}`,
                    },
                });
        }),
    resetXp: proc.input(z.object({ guild: snowflake, user: snowflake })).mutation(async ({ input: { guild, user } }) => {
        await db.delete(tables.xp).where(and(eq(tables.xp.guild, guild), eq(tables.xp.user, user)));
    }),
    getLogLocation: proc
        .input(z.object({ guild: snowflake, channels: snowflake.array(), event: z.string() }))
        .output(z.object({ type: z.enum(["webhook", "channel"]), value: z.string() }).nullable())
        .query(async ({ input: { guild, channels, event } }) => {
            const category = logEvents[event].category;

            const [settings] = await db.select().from(tables.guildLoggingSettings).where(eq(tables.guildLoggingSettings.guild, guild));
            if (!settings) return null;

            if (channels.some((ch) => settings.ignoredChannels.includes(ch))) return null;

            const entries = Object.fromEntries(
                (
                    await db
                        .select()
                        .from(tables.guildLoggingSettingsItems)
                        .where(
                            and(
                                eq(tables.guildLoggingSettingsItems.guild, guild),
                                or(eq(tables.guildLoggingSettingsItems.key, event), eq(tables.guildLoggingSettingsItems.key, category)),
                            ),
                        )
                ).map(({ key, ...data }) => [key, data]),
            );

            if (!(entries[event]?.enabled ?? true) || !(entries[category]?.enabled ?? false)) return null;

            for (const obj of [entries[event], entries[category], settings])
                if (obj?.useWebhook) {
                    if (obj.webhook) return { type: "webhook", value: obj.webhook };
                } else if (obj?.channel) return { type: "channel", value: obj.channel };

            return null;
        }),
    getWelcomeConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        const [entry] = await db
            .select({ channel: tables.guildWelcomeSettings.channel, parsed: tables.guildWelcomeSettings.parsed })
            .from(tables.guildWelcomeSettings)
            .where(eq(tables.guildWelcomeSettings.guild, guild));

        if (!entry || !entry.channel) return null;

        return { channel: entry.channel, parsed: entry.parsed as ParsedMessage };
    }),
    getSupporterAnnouncementsConfig: proc
        .input(snowflake)
        .query(async ({ input: guild }): Promise<{ useBoosts: boolean; role: string | null; channel: string | null; parsed: ParsedMessage }[]> => {
            return (await db
                .select({
                    useBoosts: tables.guildSupporterAnnouncementsItems.useBoosts,
                    role: tables.guildSupporterAnnouncementsItems.role,
                    channel: tables.guildSupporterAnnouncementsItems.channel,
                    parsed: tables.guildSupporterAnnouncementsItems.parsed,
                })
                .from(tables.guildSupporterAnnouncementsItems)
                .where(eq(tables.guildSupporterAnnouncementsItems.guild, guild))
                .limit((await getLimit(guild, "supporterAnnouncementsCountLimit")) as number)) as any;
        }),
    getXpConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getXpSettings(guild);
    }),
    getHasXpEnabled: proc.input(snowflake.array()).query(async ({ input: guilds }) => {
        return (
            await db
                .select({ guild: tables.guildModulesSettings.guild })
                .from(tables.guildModulesSettings)
                .where(
                    and(
                        inArray(tables.guildModulesSettings.guild, guilds),
                        eq(tables.guildModulesSettings.module, "xp"),
                        eq(tables.guildModulesSettings.enabled, true),
                    ),
                )
        ).map(({ guild }) => guild);
    }),
    getAllXpConfigs: proc.input(snowflake.array()).query(async ({ input: guilds }) => {
        return (await db.select().from(tables.guildXpSettings).where(inArray(tables.guildXpSettings.guild, guilds))).map(transformXpSettings);
    }),
} as const;
