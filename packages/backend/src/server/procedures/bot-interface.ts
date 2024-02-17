import { commandMap, modules, type PremiumBenefits } from "@daedalus/data";
import { logEvents } from "@daedalus/logging";
import type {
    CustomMessageText,
    GuildAutorolesSettings,
    GuildCustomRolesSettings,
    GuildModmailSettings,
    GuildReactionRolesSettings,
    GuildStickyRolesSettings,
    ParsedMessage,
} from "@daedalus/types";
import { and, count, desc, eq, gt, inArray, isNull, lt, ne, or, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { snowflake } from "../schemas";
import { decodeArray } from "../transformations";
import { proc } from "../trpc";
import { mapFiles } from "./file-service";
import {
    getAutomodSettings,
    getAutoresponderSettings,
    getAutorolesSettings,
    getCoOpSettings,
    getCustomRolesSettings,
    getNukeguardSettings,
    getReportsSettings,
    getStarboardSettings,
    getStickyRolesSettings,
    getSuggestionsSettings,
    getTicketsSettings,
    getXpSettings,
    transformGiveawayBase,
    transformXpSettings,
} from "./guild-settings";
import { getLimit } from "./premium";

const haltedActions = new Set<string>();

async function getHighlightPhrases(guild: string, user: string) {
    const [entry] = await db
        .select({ phrases: tables.highlights.phrases })
        .from(tables.highlights)
        .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));

    return entry ? (entry.phrases as string[]) : [];
}

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
    isCommandEnabled: proc.input(z.object({ guild: snowflake, command: z.string() })).query(async ({ input: { guild, command } }) => {
        const [entry] = await db
            .select({ enabled: tables.guildCommandsSettings.enabled })
            .from(tables.guildCommandsSettings)
            .where(and(eq(tables.guildCommandsSettings.guild, guild), eq(tables.guildCommandsSettings.command, command)));

        if (!entry) return commandMap[command].default ?? true;
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
    getReactionRoleEntries: proc.input(snowflake).query(async ({ input: guild }) => {
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
        .input(z.object({ guild: snowflake, user: snowflake, action: z.enum(["unmute", "unban"]), time: z.number().int() }))
        .mutation(async ({ input: { guild, user, time, action } }) => {
            await db.insert(tables.moderationRemovalTasks).values({ guild, user, time, action }).onDuplicateKeyUpdate({ set: { time } });
        }),
    getAndClearModerationRemovalTasks: proc.query(async () => {
        return await db.transaction(async (tx) => {
            const tasks = await tx.select().from(tables.moderationRemovalTasks).where(lt(tables.moderationRemovalTasks.time, Date.now()));
            await tx.delete(tables.moderationRemovalTasks).where(lt(tables.moderationRemovalTasks.time, Date.now()));

            return tasks;
        });
    }),
    addUserHistory: proc
        .input(
            z.object({
                guild: snowflake,
                user: snowflake,
                type: z.enum(["ban", "kick", "timeout", "mute", "informal_warn", "warn", "bulk"]),
                mod: snowflake,
                duration: z.number().nullable().optional(),
                origin: z.string().max(128).optional(),
                reason: z.string().max(512).nullable().optional(),
            }),
        )
        .mutation(async ({ input }) => {
            const id = await db.transaction(async (tx) => {
                const [entry] = await tx.select({ id: tables.historyIds.id }).from(tables.historyIds).where(eq(tables.historyIds.guild, input.guild));

                if (entry)
                    await tx
                        .update(tables.historyIds)
                        .set({ id: sql`id + 1` })
                        .where(eq(tables.historyIds.guild, input.guild));
                else await tx.insert(tables.historyIds).values({ guild: input.guild, id: 2 });

                return entry?.id ?? 1;
            });

            input.duration ??= 0;
            await db.insert(tables.userHistory).values({ id, ...input });

            return id;
        }),
    addMultipleUserHistory: proc
        .input(
            z.object({
                guild: snowflake,
                entries: z
                    .object({
                        user: snowflake,
                        type: z.enum(["ban", "kick", "timeout", "mute", "informal_warn", "warn", "bulk"]),
                        mod: snowflake,
                        duration: z.number().nullable().optional(),
                        origin: z.string().max(128).optional(),
                        reason: z.string().max(512).nullable().optional(),
                    })
                    .array(),
            }),
        )
        .mutation(async ({ input }) => {
            if (input.entries.length === 0) return;

            const id = await db.transaction(async (tx) => {
                const [entry] = await tx.select({ id: tables.historyIds.id }).from(tables.historyIds).where(eq(tables.historyIds.guild, input.guild));

                if (entry)
                    await tx
                        .update(tables.historyIds)
                        .set({ id: sql`id + ${input.entries.length}` })
                        .where(eq(tables.historyIds.guild, input.guild));
                else await tx.insert(tables.historyIds).values({ guild: input.guild, id: 1 + input.entries.length });

                return entry?.id ?? 1;
            });

            await db
                .insert(tables.userHistory)
                .values(input.entries.map((entry, index) => ({ guild: input.guild, id: id + index, ...entry, duration: entry.duration ?? 0 })));

            return id;
        }),
    getStickyRolesConfig: proc.input(snowflake).query(async ({ input: guild }): Promise<GuildStickyRolesSettings> => {
        return await getStickyRolesSettings(guild);
    }),
    setStickyRoles: proc
        .input(z.object({ guild: snowflake, user: snowflake, roles: snowflake.array() }))
        .mutation(async ({ input: { guild, user, roles } }) => {
            await db.transaction(async (tx) => {
                await tx.delete(tables.stickyRoles).where(and(eq(tables.stickyRoles.guild, guild), eq(tables.stickyRoles.user, user)));
                if (roles.length > 0) await tx.insert(tables.stickyRoles).values(roles.map((role) => ({ guild, user, role })));
            });
        }),
    getStickyRoles: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        return (
            await db
                .select({ role: tables.stickyRoles.role })
                .from(tables.stickyRoles)
                .where(and(eq(tables.stickyRoles.guild, guild), eq(tables.stickyRoles.user, user)))
        ).map(({ role }) => role);
    }),
    addStickyRole: proc.input(z.object({ guild: snowflake, user: snowflake, role: snowflake })).mutation(async ({ input: { guild, user, role } }) => {
        await db
            .insert(tables.stickyRoles)
            .values({ guild, user, role })
            .onDuplicateKeyUpdate({ set: { guild: sql`guild` } });
    }),
    deleteStickyRole: proc.input(z.object({ guild: snowflake, user: snowflake, role: snowflake })).mutation(async ({ input: { guild, user, role } }) => {
        await db
            .delete(tables.stickyRoles)
            .where(and(eq(tables.stickyRoles.guild, guild), eq(tables.stickyRoles.user, user), eq(tables.stickyRoles.role, role)));
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
    getAllStatsChannels: proc.query(async () => {
        const entries = await db
            .select({
                guild: tables.guildStatsChannelsItems.guild,
                channel: tables.guildStatsChannelsItems.channel,
                parsed: tables.guildStatsChannelsItems.parsed,
            })
            .from(tables.guildStatsChannelsItems);

        const guilds = new Map<string, { channel: string; parsed: CustomMessageText }[]>();

        for (const { guild, channel, parsed } of entries) {
            if (!guilds.has(guild)) guilds.set(guild, []);
            guilds.get(guild)!.push({ channel, parsed: parsed as CustomMessageText });
        }

        return [...guilds];
    }),
    getAutoresponderConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getAutoresponderSettings(guild);
    }),
    maybeLogInternalMessage: proc
        .input(
            z.object({
                channel: snowflake,
                id: snowflake,
                author: snowflake,
                content: z.string(),
                attachments: z.object({ name: z.string(), url: z.string() }).array(),
            }),
        )
        .mutation(async ({ input }) => {
            const [entry] = await db
                .select({ uuid: tables.modmailThreads.uuid })
                .from(tables.modmailThreads)
                .where(eq(tables.modmailThreads.channel, input.channel));

            if (!entry) return;

            await db.insert(tables.modmailMessages).values({
                ...defaultModmailMessage,
                uuid: entry.uuid,
                type: "internal",
                id: input.id,
                author: input.author,
                content: input.content,
                attachments: await mapFiles(input.attachments),
            });
        }),
    getOpenModmailThreads: proc.input(z.object({ guild: snowflake.nullable(), user: snowflake })).query(async ({ input: { guild, user } }) => {
        const conditions = [eq(tables.modmailThreads.user, user), eq(tables.modmailThreads.closed, false)];

        if (guild === null)
            return await db
                .select({ guild: tables.modmailThreads.guild, targetId: tables.modmailThreads.targetId })
                .from(tables.modmailThreads)
                .leftJoin(tables.tokens, eq(tables.modmailThreads.guild, tables.tokens.guild))
                .where(and(isNull(tables.tokens.guild), ...conditions));

        return await db
            .select({ guild: tables.modmailThreads.guild, targetId: tables.modmailThreads.targetId })
            .from(tables.modmailThreads)
            .where(and(eq(tables.modmailThreads.guild, guild), ...conditions));
    }),
    getModmailTargets: proc.input(snowflake).query(async ({ input: guild }): Promise<GuildModmailSettings["targets"]> => {
        const [entry] = await db
            .select({ multi: tables.guildModmailSettings.useMulti })
            .from(tables.guildModmailSettings)
            .where(eq(tables.guildModmailSettings.guild, guild));

        return (
            await db
                .select()
                .from(tables.guildModmailItems)
                .where(eq(tables.guildModmailItems.guild, guild))
                .limit(entry?.multi && (await getLimit(guild, "multiModmail")) ? ((await getLimit(guild, "modmailTargetCountLimit")) as number) : 1)
        ).map(({ pingRoles, accessRoles, openParsed, closeParsed, ...target }) => ({
            ...target,
            pingRoles: decodeArray(pingRoles),
            accessRoles: decodeArray(accessRoles),
            openParsed: openParsed as CustomMessageText,
            closeParsed: closeParsed as CustomMessageText,
        }));
    }),
    getModmailEnabledNonVanityGuilds: proc.query(async () => {
        return (
            await db
                .select({ guild: tables.guildModulesSettings.guild })
                .from(tables.guildModulesSettings)
                .leftJoin(tables.tokens, eq(tables.guildModulesSettings.guild, tables.tokens.guild))
                .where(and(eq(tables.guildModulesSettings.module, "modmail"), eq(tables.guildModulesSettings.enabled, true), isNull(tables.tokens.guild)))
        ).map(({ guild }) => guild);
    }),
    getExistingThread: proc
        .input(z.object({ guild: snowflake, user: snowflake, target: z.number().int() }))
        .query(async ({ input: { guild, user, target } }) => {
            return (
                (
                    await db
                        .select()
                        .from(tables.modmailThreads)
                        .where(and(eq(tables.modmailThreads.guild, guild), eq(tables.modmailThreads.user, user), eq(tables.modmailThreads.targetId, target)))
                ).at(0) ?? null
            );
        }),
    createModmailThread: proc
        .input(z.object({ guild: snowflake, user: snowflake, targetId: z.number().int(), targetName: z.string().max(100), channel: snowflake }))
        .mutation(async ({ input: { targetName, ...data } }) => {
            let uuid: string;

            do {
                uuid = crypto.randomUUID();
            } while ((await db.select().from(tables.modmailThreads).where(eq(tables.modmailThreads.uuid, uuid))).length > 0);

            await db
                .insert(tables.modmailThreads)
                .values({ ...data, uuid, closed: false })
                .onDuplicateKeyUpdate({ set: { channel: data.channel, closed: false } });

            await db.insert(tables.modmailMessages).values({ ...defaultModmailMessage, uuid, type: "open", author: data.user, targetName });
        }),
    reviveModmailThread: proc
        .input(z.object({ uuid: z.string().length(36), channel: snowflake, user: snowflake, targetName: z.string().max(100) }))
        .mutation(async ({ input: { uuid, channel, user, targetName } }) => {
            await db.update(tables.modmailThreads).set({ channel, closed: false }).where(eq(tables.modmailThreads.uuid, uuid));
            await db.insert(tables.modmailMessages).values({ ...defaultModmailMessage, uuid, type: "open", author: user, targetName });
        }),
    getAndUpdateModmailNotifications: proc.input(snowflake).mutation(async ({ input: channel }) => {
        return await db.transaction(async (tx) => {
            const entries = await tx
                .select({ user: tables.modmailNotifications.user })
                .from(tables.modmailNotifications)
                .where(eq(tables.modmailNotifications.channel, channel));

            await tx
                .delete(tables.modmailNotifications)
                .where(and(eq(tables.modmailNotifications.channel, channel), eq(tables.modmailNotifications.once, true)));

            return entries.map(({ user }) => user);
        });
    }),
    cancelModmailAutoclose: proc.input(snowflake).mutation(async ({ input: channel }) => {
        await db.delete(tables.modmailAutoclose).where(eq(tables.modmailAutoclose.channel, channel));
    }),
    setModmailAutoclose: proc
        .input(
            z.object({ guild: snowflake, channel: snowflake, author: snowflake, notify: z.boolean(), message: z.string().max(4000), time: z.number().int() }),
        )
        .mutation(async ({ input: { channel, ...data } }) => {
            await db
                .insert(tables.modmailAutoclose)
                .values({ channel, ...data })
                .onDuplicateKeyUpdate({ set: data });
        }),
    postIncomingModmailMessage: proc
        .input(z.object({ channel: snowflake, content: z.string().max(4000), attachments: z.object({ name: z.string(), url: z.string() }).array() }))
        .mutation(async ({ input: { channel, content, attachments } }) => {
            const [entry] = await db.select({ uuid: tables.modmailThreads.uuid }).from(tables.modmailThreads).where(eq(tables.modmailThreads.channel, channel));
            if (!entry) return;

            await db
                .insert(tables.modmailMessages)
                .values({ ...defaultModmailMessage, uuid: entry.uuid, type: "incoming", content, attachments: await mapFiles(attachments) });
        }),
    recordInternalMessageEdit: proc.input(z.object({ message: snowflake, content: z.string().max(4000) })).mutation(async ({ input: { message, content } }) => {
        const [entry] = await db.select({ edits: tables.modmailMessages.edits }).from(tables.modmailMessages).where(eq(tables.modmailMessages.id, message));
        if (!entry) return;

        await db
            .update(tables.modmailMessages)
            .set({ edits: [...(entry.edits as string[]), content] })
            .where(eq(tables.modmailMessages.id, message));
    }),
    recordInternalMessageDeletes: proc.input(snowflake.array()).mutation(async ({ input: messages }) => {
        await db.update(tables.modmailMessages).set({ deleted: true }).where(inArray(tables.modmailMessages.id, messages));
    }),
    getModmailSnippets: proc.input(snowflake).query(async ({ input: guild }) => {
        return await db.select().from(tables.guildModmailSnippets).where(eq(tables.guildModmailSnippets.guild, guild));
    }),
    getModmailThreadByChannel: proc.input(snowflake).query(async ({ input: channel }) => {
        return (await db.select().from(tables.modmailThreads).where(eq(tables.modmailThreads.channel, channel))).at(0) ?? null;
    }),
    postOutgoingModmailMessage: proc
        .input(
            z.object({
                channel: snowflake,
                target: snowflake,
                source: z.string().max(36),
                author: snowflake,
                anon: z.boolean(),
                content: z.string().max(4000),
                attachments: z.object({ name: z.string(), url: z.string() }).array(),
            }),
        )
        .mutation(async ({ input: { channel, attachments, ...data } }) => {
            const [entry] = await db.select({ uuid: tables.modmailThreads.uuid }).from(tables.modmailThreads).where(eq(tables.modmailThreads.channel, channel));
            if (!entry) return;

            await db
                .insert(tables.modmailMessages)
                .values({ ...defaultModmailMessage, ...data, uuid: entry.uuid, type: "outgoing", attachments: await mapFiles(attachments) });
        }),
    closeModmailThread: proc
        .input(z.object({ channel: snowflake, author: snowflake, content: z.string().max(4000), sent: z.boolean() }))
        .mutation(async ({ input: { channel, ...data } }) => {
            const [entry] = await db.select({ uuid: tables.modmailThreads.uuid }).from(tables.modmailThreads).where(eq(tables.modmailThreads.channel, channel));
            if (!entry) return;

            await db.update(tables.modmailThreads).set({ closed: true }).where(eq(tables.modmailThreads.uuid, entry.uuid));
            await db.insert(tables.modmailMessages).values({ ...defaultModmailMessage, uuid: entry.uuid, type: "close", ...data });
            await db.delete(tables.modmailAutoclose).where(eq(tables.modmailAutoclose.channel, channel));
        }),
    getAndClearModmailCloseTasks: proc.query(async () => {
        return await db.transaction(async (tx) => {
            const tasks = await tx.select().from(tables.modmailAutoclose).where(lt(tables.modmailAutoclose.time, Date.now()));
            await tx.delete(tables.modmailAutoclose).where(lt(tables.modmailAutoclose.time, Date.now()));

            return tasks;
        });
    }),
    setModmailNotify: proc
        .input(z.object({ channel: snowflake, user: snowflake, delete: z.boolean(), once: z.boolean() }))
        .mutation(async ({ input: { channel, user, delete: del, once } }) => {
            if (del)
                await db
                    .delete(tables.modmailNotifications)
                    .where(and(eq(tables.modmailNotifications.channel, channel), eq(tables.modmailNotifications.user, user)));
            else await db.insert(tables.modmailNotifications).values({ channel, user, once }).onDuplicateKeyUpdate({ set: { once } });
        }),
    getOutgoingModmailMessage: proc.input(z.object({ uuid: z.string().length(36), source: z.string().max(36) })).query(async ({ input: { uuid, source } }) => {
        return (
            await db
                .select()
                .from(tables.modmailMessages)
                .where(and(eq(tables.modmailMessages.uuid, uuid), eq(tables.modmailMessages.source, source)))
        ).at(0);
    }),
    recordOutgoingModmailMessageEdit: proc
        .input(z.object({ uuid: z.string().length(36), source: z.string().max(36), content: z.string().max(4000) }))
        .mutation(async ({ input: { uuid, source, content } }) => {
            const [entry] = await db
                .select({ edits: tables.modmailMessages.edits })
                .from(tables.modmailMessages)
                .where(and(eq(tables.modmailMessages.uuid, uuid), eq(tables.modmailMessages.source, source)));

            if (!entry) return;

            await db
                .update(tables.modmailMessages)
                .set({ edits: [...(entry.edits as string[]), content] })
                .where(and(eq(tables.modmailMessages.uuid, uuid), eq(tables.modmailMessages.source, source)));
        }),
    recordOutgoingModmailMessageDelete: proc
        .input(z.object({ uuid: z.string().length(36), source: z.string().max(36) }))
        .mutation(async ({ input: { uuid, source } }) => {
            await db
                .update(tables.modmailMessages)
                .set({ deleted: false })
                .where(and(eq(tables.modmailMessages.uuid, uuid), eq(tables.modmailMessages.source, source)));
        }),
    getTicketsConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getTicketsSettings(guild);
    }),
    getExistingTicket: proc
        .input(z.object({ guild: snowflake, user: snowflake, prompt: z.number().int(), target: z.number().int() }))
        .query(async ({ input: { guild, user, prompt, target } }) => {
            return (
                await db
                    .select()
                    .from(tables.tickets)
                    .where(
                        and(
                            eq(tables.tickets.guild, guild),
                            eq(tables.tickets.user, user),
                            eq(tables.tickets.prompt, prompt),
                            eq(tables.tickets.target, target),
                            eq(tables.tickets.closed, false),
                        ),
                    )
            ).at(0);
        }),
    markTicketAsClosed: proc.input(z.string().length(36)).mutation(async ({ input: uuid }) => {
        await db.update(tables.tickets).set({ closed: true }).where(eq(tables.tickets.uuid, uuid));
    }),
    openTicket: proc
        .input(z.object({ guild: snowflake, user: snowflake, prompt: z.number().int(), target: z.number().int(), author: snowflake, channel: snowflake }))
        .mutation(async ({ input: { author, ...data } }) => {
            let uuid: string;

            do {
                uuid = crypto.randomUUID();
            } while ((await db.select().from(tables.tickets).where(eq(tables.tickets.uuid, uuid))).length > 0);

            await db.insert(tables.tickets).values({ uuid, ...data, closed: false });
            await db.insert(tables.ticketMessages).values({ ...defaultTicketMessage, uuid, type: "open", author });

            return uuid;
        }),
    getTicket: proc.input(snowflake).query(async ({ input: channel }) => {
        return (
            await db
                .select({ uuid: tables.tickets.uuid, user: tables.tickets.user, prompt: tables.tickets.prompt, target: tables.tickets.target })
                .from(tables.tickets)
                .where(and(eq(tables.tickets.channel, channel), eq(tables.tickets.closed, false)))
        ).at(0);
    }),
    postTicketMessage: proc
        .input(
            z.object({
                uuid: z.string().length(36),
                id: snowflake,
                author: snowflake,
                content: z.string().max(4000),
                attachments: z.object({ name: z.string(), url: z.string() }).array(),
            }),
        )
        .mutation(async ({ input: { attachments, ...data } }) => {
            await db.insert(tables.ticketMessages).values({ ...defaultTicketMessage, type: "message", ...data, attachments: await mapFiles(attachments) });
        }),
    editTicketMessage: proc.input(z.object({ id: snowflake, content: z.string().max(4000) })).mutation(async ({ input: { id, content } }) => {
        const [entry] = await db.select({ edits: tables.ticketMessages.edits }).from(tables.ticketMessages).where(eq(tables.ticketMessages.id, id));
        if (!entry) return;

        await db
            .update(tables.ticketMessages)
            .set({ edits: [...(entry.edits as string[]), content] })
            .where(eq(tables.ticketMessages.id, id));
    }),
    deleteTicketMessages: proc.input(snowflake.array()).mutation(async ({ input: ids }) => {
        await db.update(tables.ticketMessages).set({ deleted: true }).where(inArray(tables.ticketMessages.id, ids));
    }),
    closeTicket: proc.input(z.object({ uuid: z.string().length(36), author: snowflake })).mutation(async ({ input: { uuid, author } }) => {
        await db.update(tables.tickets).set({ closed: true }).where(eq(tables.tickets.uuid, uuid));
        await db.insert(tables.ticketMessages).values({ ...defaultTicketMessage, uuid, type: "close", author });
    }),
    getNukeguardConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getNukeguardSettings(guild);
    }),
    getSuggestionsConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getSuggestionsSettings(guild);
    }),
    getNextSuggestionId: proc.input(snowflake).mutation(async ({ input: guild }) => {
        return await db.transaction(async (tx) => {
            const [entry] = await tx.select({ id: tables.suggestionIds.id }).from(tables.suggestionIds).where(eq(tables.suggestionIds.guild, guild));

            if (entry)
                await tx
                    .update(tables.suggestionIds)
                    .set({ id: sql`id + 1` })
                    .where(eq(tables.suggestionIds.guild, guild));
            else await tx.insert(tables.suggestionIds).values({ guild, id: 2 });

            return entry?.id ?? 1;
        });
    }),
    postSuggestion: proc
        .input(z.object({ guild: snowflake, id: z.number().int().min(1), channel: snowflake, message: snowflake, user: snowflake }))
        .mutation(async ({ input: data }) => {
            await db.insert(tables.suggestions).values(data);
        }),
    suggestionVote: proc.input(z.object({ message: snowflake, user: snowflake, yes: z.boolean() })).mutation(async ({ input: { message, user, yes } }) => {
        return await db.transaction(async (tx) => {
            await db.insert(tables.suggestionVotes).values({ message, user, yes }).onDuplicateKeyUpdate({ set: { yes } });

            return await Promise.all(
                [true, false].map(
                    async (yes) =>
                        (
                            await db
                                .select({ count: sql<number>`COUNT(*)` })
                                .from(tables.suggestionVotes)
                                .where(and(eq(tables.suggestionVotes.message, message), eq(tables.suggestionVotes.yes, yes)))
                        )[0].count,
                ),
            );
        });
    }),
    getSuggestion: proc.input(snowflake).query(async ({ input: message }) => {
        return (
            await db
                .select({ id: tables.suggestions.id, user: tables.suggestions.user })
                .from(tables.suggestions)
                .where(eq(tables.suggestions.message, message))
        ).at(0);
    }),
    getSuggestionById: proc.input(z.object({ guild: snowflake, id: z.number().int().min(1) })).query(async ({ input: { guild, id } }) => {
        return (
            await db
                .select()
                .from(tables.suggestions)
                .where(and(eq(tables.suggestions.guild, guild), eq(tables.suggestions.id, id)))
        ).at(0);
    }),
    getCoOpConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getCoOpSettings(guild);
    }),
    getAllRedditFeeds: proc.query(async () => {
        const entries = await db.select().from(tables.guildRedditFeedsItems);

        const guilds = new Map<string, { subreddit: string; channel: string | null }[]>();

        for (const { guild, subreddit, channel } of entries) {
            if (!guilds.has(guild)) guilds.set(guild, []);
            guilds.get(guild)!.push({ subreddit, channel });
        }

        return [...guilds];
    }),
    getCountChannel: proc.input(z.object({ guild: snowflake, channel: snowflake })).query(async ({ input: { guild, channel } }) => {
        const sq = db
            .select()
            .from(tables.guildCountItems)
            .limit((await getLimit(guild, "countCountLimit")) as number)
            .as("subquery");

        return (await db.select().from(sq).where(eq(sq.channel, channel))).at(0);
    }),
    getCountLast: proc.input(z.number().int().min(1)).query(async ({ input: id }) => {
        return (await db.select({ last: tables.countLast.last }).from(tables.countLast).where(eq(tables.countLast.id, id))).at(0)?.last ?? null;
    }),
    updateCount: proc.input(z.object({ id: z.number().int().min(1), user: snowflake })).mutation(async ({ input: { id, user } }) => {
        await db.transaction(async (tx) => {
            await tx
                .insert(tables.countScoreboard)
                .values({ id, user, score: 1 })
                .onDuplicateKeyUpdate({ set: { score: sql`score + 1` } });

            await tx
                .update(tables.guildCountItems)
                .set({ next: sql`${tables.guildCountItems.next} + ${tables.guildCountItems.interval}` })
                .where(eq(tables.guildCountItems.id, id));
        });
    }),
    getScoreboard: proc.input(z.object({ id: z.number().int().min(1), page: z.number().int().min(1) })).query(async ({ input: { id, page } }) => {
        return await db
            .select()
            .from(tables.countScoreboard)
            .where(eq(tables.countScoreboard.id, id))
            .orderBy(desc(tables.countScoreboard.score))
            .offset((page - 1) * 20)
            .limit(20);
    }),
    getGuildScoreboard: proc.input(z.object({ guild: snowflake, page: z.number().int().min(1) })).query(async ({ input: { guild, page } }) => {
        const sq = db
            .select({ id: tables.guildCountItems.id })
            .from(tables.guildCountItems)
            .where(eq(tables.guildCountItems.guild, guild))
            .limit((await getLimit(guild, "countCountLimit")) as number)
            .as("sq");

        return await db
            .select({ user: tables.countScoreboard.user, score: sum(tables.countScoreboard.score) })
            .from(tables.guildCountItems)
            .innerJoin(sq, eq(tables.guildCountItems.id, sq.id))
            .innerJoin(tables.countScoreboard, eq(tables.guildCountItems.id, tables.countScoreboard.id))
            .groupBy(tables.countScoreboard.user)
            .orderBy(desc(sum(tables.countScoreboard.score)))
            .offset((page - 1) * 20)
            .limit(20);
    }),
    getGiveaway: proc.input(z.object({ guild: snowflake, message: snowflake })).query(async ({ input: { guild, message } }) => {
        const [entry] = await db
            .select()
            .from(tables.guildGiveawayItems)
            .where(and(eq(tables.guildGiveawayItems.guild, guild), eq(tables.guildGiveawayItems.messageId, message)));

        if (!entry) return null;
        return transformGiveawayBase(entry);
    }),
    getGiveawayById: proc.input(z.object({ guild: snowflake, id: z.number().int().min(1) })).query(async ({ input: { guild, id } }) => {
        const [entry] = await db
            .select()
            .from(tables.guildGiveawayItems)
            .where(and(eq(tables.guildGiveawayItems.guild, guild), eq(tables.guildGiveawayItems.id, id)));

        if (!entry) return null;
        return transformGiveawayBase(entry);
    }),
    hasGiveawayEntry: proc.input(z.object({ guild: snowflake, id: z.number().int().min(1), user: snowflake })).query(async ({ input: { guild, id, user } }) => {
        return (
            (
                await db
                    .select({ count: count() })
                    .from(tables.giveawayEntries)
                    .where(and(eq(tables.giveawayEntries.guild, guild), eq(tables.giveawayEntries.id, id), eq(tables.giveawayEntries.user, user)))
            )[0].count > 0
        );
    }),
    addGiveawayEntry: proc
        .input(z.object({ guild: snowflake, id: z.number().int().min(1), user: snowflake }))
        .mutation(async ({ input: { guild, id, user } }) => {
            await db
                .insert(tables.giveawayEntries)
                .values({ guild, id, user })
                .onDuplicateKeyUpdate({ set: { id: sql`id` } });
        }),
    removeGiveawayEntry: proc
        .input(z.object({ guild: snowflake, id: z.number().int().min(1), user: snowflake }))
        .mutation(async ({ input: { guild, id, user } }) => {
            const { rowsAffected } = await db
                .delete(tables.giveawayEntries)
                .where(and(eq(tables.giveawayEntries.guild, guild), eq(tables.giveawayEntries.id, id), eq(tables.giveawayEntries.user, user)));

            return rowsAffected === 0;
        }),
    getGiveawayEntries: proc.input(z.object({ guild: snowflake, id: z.number().int().min(1) })).query(async ({ input: { guild, id } }) => {
        return (
            await db
                .select({ user: tables.giveawayEntries.user })
                .from(tables.giveawayEntries)
                .where(and(eq(tables.giveawayEntries.guild, guild), eq(tables.giveawayEntries.id, id)))
        ).map(({ user }) => user);
    }),
    getGiveawaysToClose: proc.query(async () => {
        return (
            await db.transaction(async (tx) => {
                const condition = and(lt(tables.guildGiveawayItems.deadline, Date.now()), eq(tables.guildGiveawayItems.closed, false));
                const results = await tx.select().from(tables.guildGiveawayItems).where(condition);
                await tx.update(tables.guildGiveawayItems).set({ closed: true }).where(condition);
                return results;
            })
        ).map(transformGiveawayBase);
    }),
    getReportsConfig: proc.input(snowflake).query(async ({ input: guild }) => {
        return await getReportsSettings(guild);
    }),
    addReporter: proc.input(z.object({ message: snowflake, user: snowflake })).mutation(async ({ input: { message, user } }) => {
        await db.insert(tables.reporters).values({ message, user }).onDuplicateKeyUpdate({ set: { user } });
    }),
    getReporter: proc.input(snowflake).query(async ({ input: message }) => {
        return (await db.select({ user: tables.reporters.user }).from(tables.reporters).where(eq(tables.reporters.message, message))).at(0)?.user ?? null;
    }),
    halt: proc.input(snowflake).mutation(async ({ input: message }) => {
        haltedActions.add(message);
    }),
    isHalted: proc.input(snowflake).query(async ({ input: message }) => {
        if (haltedActions.has(message)) {
            haltedActions.delete(message);
            return true;
        }

        return false;
    }),
    getUserHistory: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        return await db
            .select()
            .from(tables.userHistory)
            .where(and(eq(tables.userHistory.guild, guild), eq(tables.userHistory.user, user)));
    }),
    getUserNotes: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        return (
            (
                await db
                    .select({ notes: tables.notes.notes })
                    .from(tables.notes)
                    .where(and(eq(tables.notes.guild, guild), eq(tables.notes.user, user)))
            ).at(0)?.notes ?? ""
        );
    }),
    getHistoryEntry: proc.input(z.object({ guild: snowflake, id: z.number().int().min(1) })).query(async ({ input: { guild, id } }) => {
        return (
            await db
                .select()
                .from(tables.userHistory)
                .where(and(eq(tables.userHistory.guild, guild), eq(tables.userHistory.id, id)))
        ).at(0);
    }),
    deleteHistoryEntry: proc.input(z.object({ guild: snowflake, id: z.number().int().min(1) })).mutation(async ({ input: { guild, id } }) => {
        await db.delete(tables.userHistory).where(and(eq(tables.userHistory.guild, guild), eq(tables.userHistory.id, id)));
    }),
    countHistoryEntries: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        return (
            await db
                .select({ count: count() })
                .from(tables.userHistory)
                .where(and(eq(tables.userHistory.guild, guild), eq(tables.userHistory.user, user)))
        )[0].count;
    }),
    clearHistory: proc.input(z.object({ guild: snowflake, user: snowflake })).mutation(async ({ input: { guild, user } }) => {
        const { rowsAffected } = await db.delete(tables.userHistory).where(and(eq(tables.userHistory.guild, guild), eq(tables.userHistory.user, user)));
        return rowsAffected;
    }),
    setUserNotes: proc
        .input(z.object({ guild: snowflake, user: snowflake, notes: z.string().max(4096) }))
        .mutation(async ({ input: { guild, user, notes } }) => {
            await db.insert(tables.notes).values({ guild, user, notes }).onDuplicateKeyUpdate({ set: { notes } });
        }),
    countReminders: proc.input(snowflake).query(async ({ input: user }) => {
        return (await db.select({ count: count() }).from(tables.reminders).where(eq(tables.reminders.user, user)))[0].count;
    }),
    getNextReminderId: proc.input(snowflake).mutation(async ({ input: user }) => {
        return await db.transaction(async (tx) => {
            const [entry] = await tx.select({ id: tables.reminderIds.id }).from(tables.reminderIds).where(eq(tables.reminderIds.user, user));

            if (entry)
                await tx
                    .update(tables.reminderIds)
                    .set({ id: sql`id + 1` })
                    .where(eq(tables.reminderIds.user, user));
            else await tx.insert(tables.reminderIds).values({ user, id: 2 });

            return entry?.id ?? 1;
        });
    }),
    setReminder: proc
        .input(
            z.object({
                guild: snowflake.nullable(),
                id: z.number().int().min(1),
                client: snowflake,
                user: snowflake,
                time: z.number().int(),
                query: z.string().max(1024).nullable(),
                origin: z.string().max(128),
            }),
        )
        .mutation(async ({ input }) => {
            await db.insert(tables.reminders).values(input);
        }),
    listReminders: proc.input(z.object({ guild: snowflake.nullable().optional(), user: snowflake })).query(async ({ input: { guild, user } }) => {
        return await db
            .select()
            .from(tables.reminders)
            .where(
                guild === undefined
                    ? eq(tables.reminders.user, user)
                    : and(guild === null ? isNull(tables.reminders.guild) : eq(tables.reminders.guild, guild), eq(tables.reminders.user, user)),
            );
    }),
    cancelReminder: proc.input(z.object({ user: snowflake, id: z.number().int().min(1) })).mutation(async ({ input: { user, id } }) => {
        const condition = and(eq(tables.reminders.user, user), eq(tables.reminders.id, id));

        return await db.transaction(async (tx) => {
            const entry = (await db.select().from(tables.reminders).where(condition)).at(0);
            if (entry) await db.delete(tables.reminders).where(condition);
            return entry;
        });
    }),
    getAndClearPastReminders: proc.query(async () => {
        return await db.transaction(async (tx) => {
            const condition = lt(tables.reminders.time, Date.now());

            const entries = await tx.select().from(tables.reminders).where(condition);
            await tx.delete(tables.reminders).where(condition);

            return entries;
        });
    }),
    getHighlightData: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        const entry = (
            await db
                .select()
                .from(tables.highlights)
                .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)))
        ).at(0) ?? {
            guild,
            user,
            phrases: [],
            replies: false,
            cooldown: 300000,
            delay: 300000,
            blockedChannels: "",
            blockedUsers: "",
        };

        return {
            ...entry,
            phrases: entry.phrases as string[],
            blockedChannels: decodeArray(entry.blockedChannels),
            blockedUsers: decodeArray(entry.blockedUsers),
        };
    }),
    clearHighlights: proc.input(z.object({ guild: snowflake, user: snowflake })).mutation(async ({ input: { guild, user } }) => {
        await db
            .update(tables.highlights)
            .set({ phrases: [], replies: false })
            .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));
    }),
    getHighlightPhrases: proc.input(z.object({ guild: snowflake, user: snowflake })).query(async ({ input: { guild, user } }) => {
        return await getHighlightPhrases(guild, user);
    }),
    addHighlight: proc.input(z.object({ guild: snowflake, user: snowflake, phrase: z.string() })).mutation(async ({ input: { guild, user, phrase } }) => {
        const phrases = [...(await getHighlightPhrases(guild, user)), phrase];

        await db
            .insert(tables.highlights)
            .values({ guild, user, phrases: [phrase], replies: false, cooldown: 300000, delay: 300000, blockedChannels: "", blockedUsers: "" })
            .onDuplicateKeyUpdate({ set: { phrases } });
    }),
    removeHighlight: proc.input(z.object({ guild: snowflake, user: snowflake, phrase: z.string() })).mutation(async ({ input: { guild, user, phrase } }) => {
        const phrases = (await getHighlightPhrases(guild, user)).filter((x) => x !== phrase);

        await db
            .update(tables.highlights)
            .set({ phrases })
            .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));
    }),
    setHighlightReplies: proc
        .input(z.object({ guild: snowflake, user: snowflake, replies: z.boolean() }))
        .mutation(async ({ input: { guild, user, replies } }) => {
            await db
                .insert(tables.highlights)
                .values({ guild, user, phrases: [], replies, cooldown: 300000, delay: 300000, blockedChannels: "", blockedUsers: "" })
                .onDuplicateKeyUpdate({ set: { replies } });
        }),
    highlightBlock: proc
        .input(z.object({ guild: snowflake, user: snowflake, target: snowflake, key: z.enum(["blockedChannels", "blockedUsers"]) }))
        .mutation(async ({ input: { guild, user, target, key } }) => {
            const [entry] = await db
                .select({ list: tables.highlights[key] })
                .from(tables.highlights)
                .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));

            if (entry)
                if (!entry.list.match(`\\b${target}\\b`))
                    await db
                        .update(tables.highlights)
                        .set({ [key]: entry.list === "" ? target : `${entry.list}/${target}` })
                        .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));
                else return true;
            else
                await db.insert(tables.highlights).values({
                    guild,
                    user,
                    phrases: [],
                    replies: false,
                    cooldown: 300000,
                    delay: 300000,
                    blockedChannels: "",
                    blockedUsers: "",
                    [key]: target,
                });

            return false;
        }),
    highlightUnblock: proc
        .input(z.object({ guild: snowflake, user: snowflake, target: snowflake, key: z.enum(["blockedChannels", "blockedUsers"]) }))
        .mutation(async ({ input: { guild, user, target, key } }) => {
            const [entry] = await db
                .select({ list: tables.highlights[key] })
                .from(tables.highlights)
                .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));

            if (entry)
                if (entry.list.match(`\\b${target}\\b`))
                    await db
                        .update(tables.highlights)
                        .set({
                            [key]: decodeArray(entry.list)
                                .filter((x) => x !== target)
                                .join("/"),
                        })
                        .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));
                else return true;
            else return true;

            return false;
        }),
    clearHighlightBlockList: proc.input(z.object({ guild: snowflake, user: snowflake })).mutation(async ({ input: { guild, user } }) => {
        await db
            .update(tables.highlights)
            .set({ blockedChannels: "", blockedUsers: "" })
            .where(and(eq(tables.highlights.guild, guild), eq(tables.highlights.user, user)));
    }),
    setHighlightTiming: proc
        .input(z.object({ guild: snowflake, user: snowflake, time: z.number().int().min(0).max(3600000), key: z.enum(["delay", "cooldown"]) }))
        .mutation(async ({ input: { guild, user, time, key } }) => {
            await db
                .insert(tables.highlights)
                .values({ guild, user, phrases: [], replies: false, cooldown: 300000, delay: 300000, blockedChannels: "", blockedUsers: "", [key]: time })
                .onDuplicateKeyUpdate({ set: { [key]: time } });
        }),
    getGuildHighlights: proc.input(snowflake).query(async ({ input: guild }) => {
        return (await db.select().from(tables.highlights).where(eq(tables.highlights.guild, guild))).map((entry) => ({
            ...entry,
            phrases: entry.phrases as string[],
            blockedChannels: decodeArray(entry.blockedChannels),
            blockedUsers: decodeArray(entry.blockedUsers),
        }));
    }),
} as const;

const defaultModmailMessage = {
    id: "",
    source: "",
    target: "",
    author: "",
    anon: false,
    targetName: "",
    content: "",
    edits: [],
    attachments: [],
    deleted: false,
    sent: false,
} as const;

const defaultTicketMessage = {
    content: "",
    attachments: [],
    edits: [],
    deleted: false,
} as const;
