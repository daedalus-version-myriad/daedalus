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
import { and, desc, eq, gt, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
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
    getCustomRolesSettings,
    getStarboardSettings,
    getStickyRolesSettings,
    getTicketsSettings,
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
                id: snowflake,
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
