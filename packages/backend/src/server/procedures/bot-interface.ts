import { commandMap, modules, type PremiumBenefits } from "@daedalus/data";
import { logEvents } from "@daedalus/logging";
import type { GuildAutorolesSettings, GuildCustomRolesSettings, GuildReactionRolesSettings, GuildStickyRolesSettings, ParsedMessage } from "@daedalus/types";
import { and, desc, eq, gt, inArray, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { snowflake } from "../schemas";
import { decodeArray } from "../transformations";
import { proc } from "../trpc";
import {
    getAutomodSettings,
    getAutorolesSettings,
    getCustomRolesSettings,
    getStarboardSettings,
    getStickyRolesSettings,
    getXpSettings,
    transformXpSettings,
} from "./guild-settings";
import { getLimit } from "./premium";

export default {
    getColor: proc.input(snowflake).query(async ({ input: guild }) => {
        const [entry] = await db.select({ color: tables.guildSettings.embedColor }).from(tables.guildSettings).where(eq(tables.guildSettings.guild, guild));
        return entry?.color ?? 0x009688;
    }),
    getBanFooterAndEmbedColor: proc.input(snowflake).query(async ({ input: guild }) => {
        const [entry] = await db
            .select({ banFooter: tables.guildSettings.banFooter, embedColor: tables.guildSettings.embedColor })
            .from(tables.guildSettings)
            .where(eq(tables.guildSettings.guild, guild));

        return entry ?? { banFooter: "", embedColor: 0x009688 };
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
    importXp: proc
        .input(z.object({ guild: snowflake, entries: z.object({ id: snowflake, xp: z.number() }).array(), mode: z.string() }))
        .mutation(async ({ input: { guild, entries, mode } }) => {
            await db.transaction(async (tx): Promise<void> => {
                if (mode === "replace")
                    await tx.update(tables.xp).set({ textDaily: 0, textWeekly: 0, textMonthly: 0, textTotal: 0 }).where(eq(tables.xp.guild, guild));

                for (const { id, xp } of entries)
                    await tx
                        .insert(tables.xp)
                        .values({ guild, user: id, textTotal: xp })
                        .onDuplicateKeyUpdate({ set: mode === "keep" ? { user: sql`user` } : { textTotal: sql`text_total + ${xp}` } });
            });
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
    getReactionRoleEntries: proc.input(z.object({ guild: snowflake })).query(async ({ input: { guild } }) => {
        return (await db
            .select()
            .from(tables.guildReactionRolesItems)
            .where(and(eq(tables.guildReactionRolesItems.guild, guild)))) as ({ guild: string } & GuildReactionRolesSettings["prompts"][number])[];
    }),
    getStarboardConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getStarboardSettings(guild);
    }),
    getStarlink: proc.input(snowflake).query(async ({ input: source }) => {
        return (
            (await db.select({ target: tables.starboardLinks.target }).from(tables.starboardLinks).where(eq(tables.starboardLinks.source, source))).at(0)
                ?.target ?? null
        );
    }),
    getStarlinks: proc.input(snowflake.array()).query(async ({ input: sources }) => {
        return (
            await db.select({ target: tables.starboardLinks.target }).from(tables.starboardLinks).where(inArray(tables.starboardLinks.source, sources))
        ).map((x) => x.target);
    }),
    purgeStarlink: proc.input(snowflake).mutation(async ({ input: source }) => {
        await db.delete(tables.starboardLinks).where(eq(tables.starboardLinks.source, source));
    }),
    purgeStarlinksByTargets: proc.input(snowflake.array()).mutation(async ({ input: targets }) => {
        await db.delete(tables.starboardLinks).where(inArray(tables.starboardLinks.target, targets));
    }),
    addStarlink: proc.input(z.object({ source: snowflake, target: snowflake })).mutation(async ({ input: { source, target } }) => {
        await db.insert(tables.starboardLinks).values({ source, target }).onDuplicateKeyUpdate({ set: { target } });
    }),
    getAutomodConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getAutomodSettings(guild, (await getLimit(guild, "automodCountLimit")) as number);
    }),
    removeModerationRemovalTask: proc
        .input(z.object({ guild: snowflake, user: snowflake, action: z.enum(["unmute", "unban"]) }))
        .mutation(async ({ input: { guild, user, action } }) => {
            await db
                .delete(tables.moderationRemovalTasks)
                .where(
                    and(
                        eq(tables.moderationRemovalTasks.guild, guild),
                        eq(tables.moderationRemovalTasks.user, user),
                        eq(tables.moderationRemovalTasks.action, action),
                    ),
                );
        }),
    setModerationRemovalTask: proc
        .input(z.object({ guild: snowflake, user: snowflake, action: z.enum(["unmute", "unban"]), time: z.date() }))
        .mutation(async ({ input: { guild, user, time, action } }) => {
            await db.insert(tables.moderationRemovalTasks).values({ guild, user, time, action }).onDuplicateKeyUpdate({ set: { time } });
        }),
    addUserHistory: proc
        .input(
            z.object({
                guild: snowflake,
                user: snowflake,
                type: z.enum(["ban", "kick", "timeout", "mute", "informal_warn", "warn", "bulk"]),
                mod: snowflake,
                duration: z.number().optional(),
                origin: z.string().max(128).optional(),
                reason: z.string().max(512).optional(),
            }),
        )
        .mutation(async ({ input }) => {
            await db.insert(tables.userHistory).values(input);
        }),
    getStickyRolesConfig: proc.input(snowflake).query(async ({ input: guild }): Promise<GuildStickyRolesSettings> => {
        return await getStickyRolesSettings(guild);
    }),
    setStickyRoles: proc
        .input(z.object({ guild: snowflake, user: snowflake, roles: snowflake.array() }))
        .mutation(async ({ input: { guild, user, roles: array } }) => {
            const roles = array.join("/");
            await db.insert(tables.stickyRoles).values({ guild, user, roles }).onDuplicateKeyUpdate({ set: { roles } });
        }),
    getStickyRoles: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        const [entry] = await db
            .select({ roles: tables.stickyRoles.roles })
            .from(tables.stickyRoles)
            .where(and(eq(tables.stickyRoles.guild, guild), eq(tables.stickyRoles.user, user)));

        return decodeArray(entry?.roles ?? "");
    }),
    getAutorolesConfig: proc.input(snowflake).query(async ({ input: guild }): Promise<GuildAutorolesSettings> => {
        return await getAutorolesSettings(guild);
    }),
    getCustomRolesConfig: proc.input(snowflake).query(async ({ input: guild }): Promise<GuildCustomRolesSettings> => {
        return await getCustomRolesSettings(guild);
    }),
    getCustomRole: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        return (
            (
                await db
                    .select({ role: tables.customRoles.role })
                    .from(tables.customRoles)
                    .where(and(eq(tables.customRoles.guild, guild), eq(tables.customRoles.user, user)))
            ).at(0)?.role ?? null
        );
    }),
    setCustomRole: proc.input(z.object({ guild: snowflake, user: snowflake, role: snowflake })).mutation(async ({ input: { guild, user, role } }) => {
        await db.insert(tables.customRoles).values({ guild, user, role });
    }),
    deleteCustomRole: proc.input(z.object({ guild: snowflake, user: snowflake })).mutation(async ({ input: { guild, user } }) => {
        await db.delete(tables.customRoles).where(and(eq(tables.customRoles.guild, guild), eq(tables.customRoles.user, user)));
    }),
    deleteCustomRoles: proc.input(z.object({ guild: snowflake, users: snowflake.array() })).mutation(async ({ input: { guild, users } }) => {
        await db.delete(tables.customRoles).where(and(eq(tables.customRoles.guild, guild), inArray(tables.customRoles.user, users)));
    }),
    getAllCustomRoles: proc.input(snowflake).query(async ({ input: guild }) => {
        return await db
            .select({ user: tables.customRoles.user, role: tables.customRoles.role })
            .from(tables.customRoles)
            .where(eq(tables.customRoles.guild, guild));
    }),
} as const;
