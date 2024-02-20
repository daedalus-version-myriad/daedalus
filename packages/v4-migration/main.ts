import { trpc } from "@daedalus/api";
import { db, tables } from "@daedalus/backend";
import { truncate } from "@daedalus/bot-utils";
import { secrets } from "@daedalus/config";
import { serializeGiveawayBase } from "@daedalus/global-utils";
import { count, eq, sql } from "drizzle-orm";
import { splitMessage } from "./lib";
import { connect, db as src } from "./mongo";
import { PremiumTier } from "./premium";

let keys = Bun.env.KEYS ? Bun.env.KEYS.split(":").filter((x) => x) : null;

async function migrate(key: string, fn: () => Promise<unknown>) {
    if (!keys || keys.includes(key)) {
        await fn();
        console.log(`migrated: ${key}`);
    } else if (keys.includes(`after=${key}`)) {
        keys = null;
        await fn();
        console.log(`migrated: ${key}`);
    }
}

await connect(secrets.MIGRATION.MONGO_URI, secrets.MIGRATION.MONGO_NAME);

console.log("connected to mongo");

await migrate("admins", async () => {
    await db.delete(tables.admins);
    const entries = await src.admins.find().toArray();
    if (entries.length > 0) await db.insert(tables.admins).values(entries.map((x) => ({ id: x.user })));
});

await migrate("tokens", async () => {
    await db.delete(tables.tokens);
    const entries = await src.guilds.find({ token: { $ne: null } }).toArray();
    if (entries.length > 0) await db.insert(tables.tokens).values(entries.map((x) => ({ guild: x.guild, token: x.token! })));
});

await migrate("settings", async () => {
    await db.delete(tables.guildSettings);
    const entries = await src.guildSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                dashboardPermission: x.dashboardPermissions,
                embedColor: x.embedColor,
                muteRole: x.muteRole,
                banFooter: x.banFooter,
                modOnly: x.modOnly,
                allowedRoles: x.allowedRoles.join("/"),
                blockedRoles: x.blockedRoles.join("/"),
                allowlistOnly: x.allowlistOnly,
                allowedChannels: x.allowedChannels.join("/"),
                blockedChannels: x.blockedChannels.join("/"),
            })),
        );
});

await migrate("premium", async () => {
    await db.delete(tables.guildPremiumSettings);
    const entries = await src.guilds.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildPremiumSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                hasPremium: x.tier !== PremiumTier.FREE,
                hasCustom: x.tier === PremiumTier.ULTIMATE,
                status: (x.status ?? "online") as any,
                activityType: (x.activityType ?? "watching") as any,
                activity: x.statusText ?? "for /help",
            })),
        );
});

await migrate("modules", async () => {
    await db.delete(tables.guildModulesSettings);
    const entries = await src.modulesPermissionsSettings.find().toArray();
    if (entries.length > 0)
        await db
            .insert(tables.guildModulesSettings)
            .values(entries.flatMap((x) => Object.entries(x.modules).map(([key, value]) => ({ guild: x.guild, module: key, enabled: value.enabled }))));
});

await migrate("commands", async () => {
    await db.delete(tables.guildCommandsSettings);
    const entries = await src.modulesPermissionsSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildCommandsSettings).values(
            entries.flatMap((x) =>
                Object.entries(x.commands ?? {}).map(([key, value]) => ({
                    guild: x.guild,
                    command: key,
                    enabled: value.enabled,
                    ignoreDefaultPermissions: value.ignoreDefaultPermissions,
                    allowedRoles: value.allowedRoles.join("/"),
                    blockedRoles: value.blockedRoles.join("/"),
                    restrictChannels: value.restrictChannels,
                    allowedChannels: value.allowedChannels.join("/"),
                    blockedChannels: value.blockedChannels.join("/"),
                })),
            ),
        );
});

await migrate("logging", async () => {
    await db.delete(tables.guildLoggingSettings);
    await db.delete(tables.guildLoggingSettingsItems);
    const entries = await src.loggingSettings.find().toArray();
    if (entries.length > 0) {
        await db.insert(tables.guildLoggingSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                enableWebLogging: false,
                useWebhook: x.useWebhook,
                channel: x.defaultChannel,
                webhook: x.defaultWebhook,
                ignoredChannels: x.ignoredChannels.join("/"),
                fileOnlyMode: x.filesOnly,
            })),
        );
        await db.insert(tables.guildLoggingSettingsItems).values(
            entries.flatMap((x) =>
                Object.entries(x.categories)
                    .flatMap(
                        ([key, value]) =>
                            [[key, value], ...Object.entries(value.events)] satisfies [
                                string,
                                { enabled: boolean; useWebhook: boolean; outputChannel: string | null; outputWebhook: string },
                            ][],
                    )
                    .map(([key, value]) => ({
                        guild: x.guild,
                        key,
                        enabled: value.enabled,
                        useWebhook: value.useWebhook,
                        channel: value.outputChannel,
                        webhook: value.outputWebhook,
                    })),
            ),
        );
    }
});

await migrate("welcome", async () => {
    await db.delete(tables.guildWelcomeSettings);
    const entries = await src.welcomeSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildWelcomeSettings).values(entries.map((x) => ({ guild: x.guild, channel: x.channel, ...splitMessage(x.message) })));
});

await migrate("supporter-announcements", async () => {
    await db.delete(tables.guildSupporterAnnouncementsItems);
    const entries = await src.supporterAnnouncementSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildSupporterAnnouncementsItems).values(
            entries.flatMap((x) =>
                x.entries.map((data) => ({
                    guild: x.guild,
                    useBoosts: data.boosts,
                    role: data.role,
                    channel: data.channel,
                    ...splitMessage(data.message),
                })),
            ),
        );
});

await migrate("xp", async () => {
    await db.delete(tables.guildXpSettings);
    const entries = await src.xpSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildXpSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                blockedChannels: x.blockedChannels.join("/"),
                blockedRoles: x.blockedRoles.join("/"),
                bonusChannels: x.bonusChannels.map((e) => `${e.channel}:${e.multiplier}`).join("/"),
                bonusRoles: x.bonusRoles.map((e) => `${e.role}:${e.multiplier}`).join("/"),
                rankCardBackground: x.rankCardBackground,
                announceLevelUp: x.announceLevelUp,
                announceInChannel: x.announceInChannel,
                announceChannel: x.announceChannel,
                announcementBackground: x.announcementBackground,
                rewards: x.rewards.map((e) => `${e.text}:${e.voice}:${e.role}:${e.removeOnHigher}:${e.dmOnReward}`).join("/"),
            })),
        );
});

await migrate("reaction-roles", async () => {
    await db.delete(tables.guildReactionRolesItems);
    const entries = await src.reactionRolesSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildReactionRolesItems).values(
            entries.flatMap((x) =>
                x.entries.map((data) => ({
                    guild: x.guild,
                    id: data.id,
                    name: data.name,
                    addToExisting: data.addReactionsToExistingMessage,
                    channel: data.channel,
                    message: data.message,
                    url: data.url,
                    style: data.style,
                    type: data.type,
                    dropdownData: data.dropdownData,
                    buttonData: data.buttonData,
                    reactionData: data.reactionData,
                    promptMessage: splitMessage(data.promptMessage).message,
                    error: data.error,
                })),
            ),
        );
});

await migrate("starboard", async () => {
    await db.delete(tables.guildStarboardSettings);
    await db.delete(tables.guildStarboardOverrides);
    const entries = await src.starboardSettings.find().toArray();
    if (entries.length > 0) {
        await db
            .insert(tables.guildStarboardSettings)
            .values(entries.map((x) => ({ guild: x.guild, reaction: x.detectEmoji, channel: x.defaultChannel, threshold: x.defaultThreshold ?? 5 })));
        await db.insert(tables.guildStarboardOverrides).values(
            entries
                .flatMap((x) =>
                    Object.entries(x.channels).map(([key, value]) => ({
                        guild: x.guild,
                        channel: key,
                        enabled: !value.disable,
                        target: value.overrideChannel,
                        threshold: value.overrideThreshold,
                    })),
                )
                .filter((entry) => !entry.enabled || entry.target || entry.threshold),
        );
    }
});

await migrate("automod", async () => {
    await db.delete(tables.guildAutomodSettings);
    await db.delete(tables.guildAutomodItems);
    const entries = await src.automodSettings.find().toArray();
    if (entries.length > 0) {
        await db.insert(tables.guildAutomodSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                ignoredChannels: x.ignoredChannels,
                ignoredRoles: x.ignoredRoles,
                defaultChannel: x.defaultChannel,
                interactWithWebhooks: x.interactWithWebhooks,
            })),
        );
        await db.insert(tables.guildAutomodItems).values(entries.flatMap((x) => x.rules.map(({ id, ...rule }) => ({ guild: x.guild, ...rule }))));
    }
});

await migrate("sticky-roles", async () => {
    await db.delete(tables.guildStickyRolesSettings);
    const entries = await src.stickyRolesSettings.find().toArray();
    if (entries.length > 0) await db.insert(tables.guildStickyRolesSettings).values(entries.map((x) => ({ guild: x.guild, roles: x.exclude.join("/") })));
});

await migrate("autoroles", async () => {
    await db.delete(tables.guildAutorolesSettings);
    const entries = await src.autorolesSettings.find().toArray();
    if (entries.length > 0) await db.insert(tables.guildAutorolesSettings).values(entries.map((x) => ({ guild: x.guild, roles: x.roles.join("/") })));
});

await migrate("custom-roles", async () => {
    await db.delete(tables.guildCustomRolesSettings);
    const entries = await src.customRolesSettings.find().toArray();
    if (entries.length > 0)
        await db
            .insert(tables.guildCustomRolesSettings)
            .values(entries.map((x) => ({ guild: x.guild, allowBoosters: x.allowBoosters, roles: x.allowedRoles.join("/"), anchor: x.anchor })));
});

await migrate("stats-channels", async () => {
    await db.delete(tables.guildStatsChannelsItems);
    const entries = await src.statsChannelsSettings.find().toArray();
    if (entries.length > 0)
        await db
            .insert(tables.guildStatsChannelsItems)
            .values(
                entries.flatMap((x) =>
                    x.channels.filter((x) => x.channel).map((data) => ({ guild: x.guild, channel: data.channel!, format: data.format, parsed: data.parsed })),
                ),
            );
});

await migrate("autoresponder", async () => {
    await db.delete(tables.guildAutoresponderSettings);
    await db.delete(tables.guildAutoresponderItems);
    const entries = await src.autoresponderSettings.find().toArray();
    if (entries.length > 0) {
        await db.insert(tables.guildAutoresponderSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                onlyInAllowedChannels: x.onlyInAllowedChannels,
                onlyToAllowedRoles: x.onlyToAllowedRoles,
                allowedChannels: x.allowedChannels.join("/"),
                allowedRoles: x.allowedRoles.join("/"),
                blockedChannels: x.blockedChannels.join("/"),
                blockedRoles: x.blockedRoles.join("/"),
            })),
        );
        await db.insert(tables.guildAutoresponderItems).values(
            entries.flatMap((x) =>
                x.triggers.map((data) => ({
                    guild: x.guild,
                    ...data,
                    ...splitMessage(data.message),
                    allowedChannels: data.allowedChannels.join("/"),
                    allowedRoles: data.allowedRoles.join("/"),
                    blockedChannels: data.blockedChannels.join("/"),
                    blockedRoles: data.blockedRoles.join("/"),
                })),
            ),
        );
    }
});

await migrate("modmail", async () => {
    await db.delete(tables.guildModmailSettings);
    await db.delete(tables.guildModmailItems);
    await db.delete(tables.guildModmailSnippets);
    const entries = await src.modmailSettings.find().toArray();
    if (entries.length > 0) {
        await db.insert(tables.guildModmailSettings).values(entries.map((x) => ({ guild: x.guild, useMulti: x.multi })));
        await db.insert(tables.guildModmailItems).values(
            entries.flatMap((x) =>
                x.targets.map(({ id, logChannel, openMessageParsed, closeMessageParsed, ...data }) => ({
                    guild: x.guild,
                    channel: logChannel,
                    ...data,
                    pingRoles: data.pingRoles.join("/"),
                    accessRoles: data.accessRoles.join("/"),
                    openParsed: openMessageParsed,
                    closeParsed: closeMessageParsed,
                })),
            ),
        );
        await db.insert(tables.guildModmailSnippets).values(entries.flatMap((x) => x.snippets.map((data) => ({ guild: x.guild, ...data }))));
    }
});

await migrate("tickets", async () => {
    await db.delete(tables.guildTicketsItems);
    await db.delete(tables.guildTicketsTargets);
    const entries = await src.ticketsSettings.find().toArray();
    if (entries.length > 0) {
        const incs: Record<string, number> = {};
        await db
            .insert(tables.guildTicketsItems)
            .values(
                entries.flatMap((x) => x.prompts.map(({ multi, name, ...data }) => ({ guild: x.guild, useMulti: multi, name: truncate(name, 128), ...data }))),
            );
        await db.insert(tables.guildTicketsTargets).values(
            entries.flatMap((x) =>
                x.prompts.flatMap(({ id, targets }) =>
                    targets.map(({ id: _, label, description, customOpenMessage, pingRoles, accessRoles, ...data }) => ({
                        id: Date.now() * 100 + ((incs[x.guild] ??= 0), incs[x.guild]++),
                        guild: x.guild,
                        promptId: id,
                        ...data,
                        buttonLabel: label,
                        dropdownLabel: label,
                        dropdownDescription: description,
                        pingRoles: pingRoles.join("/"),
                        accessRoles: accessRoles.join("/"),
                        customOpenMessage: splitMessage(customOpenMessage).message,
                        customOpenParsed: splitMessage(customOpenMessage).parsed,
                    })),
                ),
            ),
        );
    }
});

await migrate("nukeguard", async () => {
    await db.delete(tables.guildNukeguardSettings);
    const entries = await src.nukeguardSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildNukeguardSettings).values(
            entries.map(
                ({
                    guild,
                    alertChannel,
                    pingRoles,
                    exemptedRoles,
                    ignoredChannels,
                    watchedChannels,
                    ignoredRoles,
                    watchedRoles,
                    ignoredEmoji,
                    watchedEmoji,
                    ignoredStickers,
                    watchedStickers,
                    watchEmojiByDefault,
                    watchStickersByDefault,
                    watchSoundsByDefault,
                    ratelimitEnabled,
                    ratelimitKicks,
                    threshold,
                    timeInSeconds,
                    restrictRolesBlockByDefault,
                    restrictRolesLenientMode,
                    restrictRolesAllowedRoles,
                    restrictRolesBlockedRoles,
                    ...data
                }) => ({
                    guild,
                    adminChannel: alertChannel,
                    pingRoles: pingRoles.join("/"),
                    exemptedRoles: exemptedRoles.join("/"),
                    ignoredChannels: ignoredChannels.join("/"),
                    watchedChannels: watchedChannels.join("/"),
                    ignoredRoles: ignoredRoles.join("/"),
                    watchedRoles: watchedRoles.join("/"),
                    watchEmoji: watchEmojiByDefault,
                    watchStickers: watchStickersByDefault,
                    watchSounds: watchSoundsByDefault,
                    enableRatelimit: ratelimitEnabled,
                    ratelimitKicking: ratelimitKicks,
                    ratelimitThreshold: threshold,
                    ratelimitTime: timeInSeconds,
                    restrictRolesByDefault: restrictRolesBlockByDefault,
                    restrictRolesLenient: restrictRolesLenientMode,
                    restrictRolesAllowedRoles: restrictRolesAllowedRoles.join("/"),
                    restrictRolesBlockedRoles: restrictRolesBlockedRoles.join("/"),
                    ...data,
                }),
            ),
        );
});

await migrate("suggestions", async () => {
    await db.delete(tables.guildSuggestionsSettings);
    const entries = await src.suggestionsSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildSuggestionsSettings).values(entries.map((x) => ({ guild: x.guild, channel: x.outputChannel, anon: x.anonymous })));
});

await migrate("co-op", async () => {
    await db.delete(tables.guildCoOpSettings);
    const entries = await src.coOpSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildCoOpSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                wl0: x.worldLevelRoles[0],
                wl1: x.worldLevelRoles[1],
                wl2: x.worldLevelRoles[2],
                wl3: x.worldLevelRoles[3],
                wl4: x.worldLevelRoles[4],
                wl5: x.worldLevelRoles[5],
                wl6: x.worldLevelRoles[6],
                wl7: x.worldLevelRoles[7],
                wl8: x.worldLevelRoles[8],
                regionNA: x.regionRoles[0],
                regionEU: x.regionRoles[1],
                regionAS: x.regionRoles[2],
                regionSA: x.regionRoles[3],
                helperNA: x.helperRoles[0],
                helperEU: x.helperRoles[1],
                helperAS: x.helperRoles[2],
                helperSA: x.helperRoles[3],
            })),
        );
});

await migrate("reddit-feeds", async () => {
    await db.delete(tables.guildRedditFeedsItems);
    const entries = await src.redditFeedsSettings.find().toArray();
    if (entries.length > 0)
        await db
            .insert(tables.guildRedditFeedsItems)
            .values(entries.flatMap((x) => x.feeds.map((feed) => ({ guild: x.guild, subreddit: feed.subreddit, channel: feed.channel }))));
});

await migrate("count", async () => {
    await db.delete(tables.guildCountItems);
    const entries = await src.countSettings.find().toArray();
    if (entries.length > 0)
        await db
            .insert(tables.guildCountItems)
            .values(
                entries.flatMap((x) => x.channels.filter((x) => x.channel).map(({ id, channel, ...data }) => ({ guild: x.guild, channel: channel!, ...data }))),
            );
});

await migrate("giveaways", async () => {
    await db.delete(tables.giveawayIds);
    await db.delete(tables.guildGiveawayTemplates);
    await db.delete(tables.guildGiveawayItems);
    const entries = await src.giveawaysSettings.find().toArray();
    if (entries.length > 0) {
        await db
            .insert(tables.giveawayIds)
            .values(entries.filter((x) => x.giveaways.length > 0).map((x) => ({ guild: x.guild, id: Math.max(...x.giveaways.map((x) => x.id)) + 1 })));
        await db.insert(tables.guildGiveawayTemplates).values(entries.map((x) => ({ guild: x.guild, ...serializeGiveawayBase(x.template) })));
        await db
            .insert(tables.guildGiveawayItems)
            .values(entries.flatMap((x) => x.giveaways.map((data) => ({ guild: x.guild, ...serializeGiveawayBase(data) }))));
    }
});

await migrate("reports", async () => {
    await db.delete(tables.guildReportsSettings);
    const entries = await src.reportsSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildReportsSettings).values(
            entries.map((x) => ({
                guild: x.guild,
                channel: x.outputChannel,
                pingRoles: x.pingRoles.join("/"),
                anon: x.anonymous,
                viewRoles: x.viewRoles.join("/"),
            })),
        );
});

await migrate("utility", async () => {
    await db.delete(tables.guildUtilitySettings);
    const entries = await src.utilitySettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.guildUtilitySettings).values(
            entries.map((x) => ({
                guild: x.guild,
                roleCommandBlockByDefault: x.blockRolesByDefault,
                roleCommandBlockedRoles: x.blockedRoles.join("/"),
                roleCommandAllowedRoles: x.allowedRoles.join("/"),
                roleCommandBypassRoles: x.bypassRoles.join("/"),
            })),
        );
});

await migrate("keys", async () => {
    await db.delete(tables.premiumKeys);
    await db.delete(tables.premiumKeyBindings);
});

await migrate("accounts", async () => {
    await db.delete(tables.accountSettings);
    const entries = await src.accountSettings.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.accountSettings).values(
            entries.map((x) => ({
                user: x.user,
                notifyPremiumOwnedServers: x.notifyWhenOwnedServerPremiumStatusChanges,
                notifyPremiumManagedServers: x.notifyWhenManagedServerPremiumStatusChanges,
            })),
        );
});

await migrate("limit-overrides", async () => {
    await db.delete(tables.limitOverrides);
    await db.delete(tables.premiumKeys);
    await db.delete(tables.premiumKeyBindings);
    const entries = await src.premiumOverrides.find().toArray();
    if (entries.length > 0) await db.insert(tables.limitOverrides).values(entries);

    for (const entry of [...entries, /* override for katsumi */ { vanityClient: true, guild: "1170881493099368479" }])
        if (entry.vanityClient) {
            const key = `ck_${new Array(20)
                .fill(0)
                .map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)])
                .join("")}`;

            await db.insert(tables.premiumKeys).values({ user: secrets.OWNER, key });
            await db.insert(tables.premiumKeyBindings).values({ guild: entry.guild, key });
        }
});

await migrate("xp-amounts", async () => {
    while (true) {
        const [{ count: x }] = await db.select({ count: count() }).from(tables.xp);
        if (x === 0) break;
        await db.execute(sql`delete from xp_amounts limit 100000`);
    }
    const entries = await src.xpAmounts
        .find({
            $or: [
                { "daily.text": { $gt: 0 } },
                { "weekly.text": { $gt: 0 } },
                { "monthly.text": { $gt: 0 } },
                { "total.text": { $gt: 0 } },
                { "daily.voice": { $gt: 0 } },
                { "weekly.voice": { $gt: 0 } },
                { "monthly.voice": { $gt: 0 } },
                { "total.voice": { $gt: 0 } },
            ],
        })
        .toArray();
    entries.sort((x, y) => y.total.text - x.total.text || y.total.voice - x.total.voice);
    const filtered: typeof entries = [];
    const seen = new Set<string>();
    for (const entry of entries) {
        if (seen.has(`${entry.guild}-${entry.user}`)) continue;
        seen.add(`${entry.guild}-${entry.user}`);
        filtered.push(entry);
    }
    while (filtered.length > 0)
        await db.insert(tables.xp).values(
            filtered.splice(0, 5000).map((x) => ({
                guild: x.guild,
                user: x.user,
                textDaily: x.daily?.text ?? 0,
                textWeekly: x.weekly?.text ?? 0,
                textMonthly: x.monthly?.text ?? 0,
                textTotal: x.total?.text ?? 0,
                voiceDaily: x.daily?.voice ?? 0,
                voiceWeekly: x.weekly?.voice ?? 0,
                voiceMonthly: x.monthly?.voice ?? 0,
                voiceTotal: x.total?.voice ?? 0,
            })),
        );
});

await migrate("starlinks", async () => {
    await db.delete(tables.starboardLinks);
    const entries = await src.starboardLinks.find().toArray();
    if (entries.length > 0)
        await db
            .insert(tables.starboardLinks)
            .values(Object.entries(Object.fromEntries(entries.map((x) => [x.message, x.target]))).map(([source, target]) => ({ source, target })));
});

await migrate("unmod-tasks", async () => {
    await db.delete(tables.moderationRemovalTasks);
    const entries = await src.tasks.find({ action: { $in: ["unmute", "unban"] } }).toArray();
    if (entries.length > 0)
        await db
            .insert(tables.moderationRemovalTasks)
            .values(
                entries
                    .filter((x) => !isNaN(x.time) && x.time !== Infinity)
                    .flatMap((x) => (x.action === "unmute" || x.action === "unban" ? [{ guild: x.guild!, user: x.user, action: x.action, time: x.time }] : [])),
            );
});

await migrate("history", async () => {
    await db.delete(tables.userHistory);
    await db.delete(tables.historyIds);
    const entries = await src.userHistory.find().sort({ time: 1 }).toArray();
    const map = new Map<string, typeof entries>();
    for (const entry of entries) {
        if (!map.has(entry.guild)) map.set(entry.guild, []);
        map.get(entry.guild)!.push({ ...entry, reason: entry.reason ? truncate(entry.reason, 512) : null });
    }
    for (const [guild, entries] of map) while (entries.length > 0) await trpc.addMultipleUserHistory.mutate({ guild, entries: entries.splice(0, 5000) });
});

await migrate("sticky-role-lists", async () => {
    while (true) {
        const [{ count: x }] = await db.select({ count: count() }).from(tables.stickyRoles);
        if (x === 0) break;
        await db.execute(sql`delete from sticky_roles limit 100000`);
    }
    const entries = await src.stickyRoles.find().toArray();
    while (entries.length > 0)
        await db
            .insert(tables.stickyRoles)
            .values(entries.splice(0, 1000).flatMap((entry) => entry.roles.map((role) => ({ guild: entry.guild, user: entry.user, role }))));
});

await migrate("custom-role-list", async () => {
    await db.delete(tables.customRoles);
    const entries = await src.customRoles.find().toArray();
    if (entries.length > 0) await db.insert(tables.customRoles).values(entries);
});

await migrate("modmail-threads", async () => {
    await db.delete(tables.modmailThreads);
    await db.delete(tables.modmailMessages);
    const entries = await src.modmailThreads.find({ channel: { $exists: true } }).toArray();
    while (entries.length > 0) {
        const block = entries.splice(0, 100);
        await db.insert(tables.modmailThreads).values(block.map((x) => ({ ...x, targetId: x.id })));
        await db.insert(tables.modmailMessages).values(
            block.flatMap((x) =>
                x.messages.map((data) => ({
                    uuid: x.uuid,
                    time: new Date(data.time),
                    type: data.type,
                    id: data.type === "internal" ? data.id ?? "" : "",
                    source: data.type === "outgoing" ? `${data.source}` : "",
                    target: data.type === "outgoing" ? data.message : "",
                    author: data.type === "incoming" ? x.user : data.author,
                    anon: data.type === "outgoing" ? data.anon : false,
                    targetName: data.type === "open" ? data.targetName ?? "" : "",
                    content: "content" in data ? data.content ?? "" : "",
                    edits: "edits" in data ? data.edits ?? [] : [],
                    attachments: "attachments" in data ? data.attachments : [],
                    deleted: "deleted" in data ? data.deleted : false,
                    sent: "sent" in data ? data.sent : false,
                })),
            ),
        );
    }
});

await migrate("modmail-notifications", async () => {
    await db.delete(tables.modmailNotifications);
    const entries = await src.modmailNotifications.find().toArray();
    if (entries.length > 0) await db.insert(tables.modmailNotifications).values(entries);
});

await migrate("modmail-autoclose", async () => {
    await db.delete(tables.modmailAutoclose);
    const entries = await src.tasks.find({ action: "modmail/close" }).toArray();
    if (entries.length > 0) await db.insert(tables.modmailAutoclose).values(entries.flatMap((x) => (x.action === "modmail/close" ? [x] : [])));
});

await migrate("ticket-threads", async () => {
    await db.delete(tables.tickets);
    await db.delete(tables.ticketMessages);
    const entries = await src.tickets.find().toArray();
    while (entries.length > 0) {
        const block = entries.splice(0, 100);
        await db.insert(tables.tickets).values(block);
        await db.insert(tables.ticketMessages).values(
            block.flatMap((x) =>
                x.messages.map((data) => ({
                    uuid: x.uuid,
                    time: new Date(data.time),
                    type: data.type,
                    id: data.type === "message" ? data.id : "",
                    author: data.type === "open" ? "" : data.author,
                    content: data.type === "message" ? data.content : "",
                    attachments: data.type === "message" ? data.attachments : [],
                    edits: data.type === "message" ? data.edits ?? [] : [],
                    deleted: data.type === "message" ? !!data.deleted : false,
                })),
            ),
        );
    }
});

await migrate("suggestion-posts", async () => {
    await db.delete(tables.suggestionIds);
    await db.delete(tables.suggestions);
    await db.delete(tables.suggestionVotes);
    const entries = await src.suggestionPosts.find().toArray();
    if (entries.length === 0) return;
    const max = new Map<string, number>();
    for (const entry of entries) {
        max.set(entry.guild, Math.max(max.get(entry.guild) ?? 0, entry.id));
    }
    await db.insert(tables.suggestionIds).values([...max].map(([guild, id]) => ({ guild, id: id + 1 })));
    await db.insert(tables.suggestions).values(entries);
    await db.insert(tables.suggestionVotes).values(entries.flatMap((x) => x.yes.map((user) => ({ message: x.message, user, yes: true }))));
    await db.insert(tables.suggestionVotes).values(entries.flatMap((x) => x.no.map((user) => ({ message: x.message, user, yes: false }))));
});

await migrate("count-scoreboards", async () => {
    await db.delete(tables.countLast);
    await db.delete(tables.countScoreboard);
    const entries = await src.countScoreboards.find().toArray();
    for (const entry of entries) {
        const config = await src.countSettings.findOne({ guild: entry.guild });
        if (!config) continue;
        const counter = config.channels.find((x) => x.id === entry.id);
        if (!counter?.channel) continue;
        const [item] = await db
            .select({ id: tables.guildCountItems.id })
            .from(tables.guildCountItems)
            .where(eq(tables.guildCountItems.channel, counter.channel));
        if (!item) continue;
        await db.insert(tables.countLast).values({ id: item.id, last: entry.last });
        await db.insert(tables.countScoreboard).values(Object.entries(entry.scores).map(([user, score]) => ({ id: item.id, user, score })));
    }
});

await migrate("giveaway-entries", async () => {
    await db.delete(tables.giveawayEntries);
    const entries = await src.giveawayEntries.find().toArray();
    if (entries.length > 0) await db.insert(tables.giveawayEntries).values(entries);
});

await migrate("reporters", async () => {
    await db.delete(tables.reporters);
    const entries = await src.reporters.find().toArray();
    if (entries.length > 0) await db.insert(tables.reporters).values(entries);
});

await migrate("notes", async () => {
    await db.delete(tables.notes);
    const entries = await src.userNotes.find().toArray();
    if (entries.length > 0) await db.insert(tables.notes).values(entries);
});

await migrate("reminders", async () => {
    await db.delete(tables.reminderIds);
    await db.delete(tables.reminders);
    const entries = await src.tasks.find({ action: "remind" }).toArray();
    if (entries.length > 0) {
        const max = new Map<string, number>();
        for (const entry of entries) if (entry.action === "remind") max.set(entry.user, Math.max(max.get(entry.user) ?? 0, entry.id));
        await db.insert(tables.reminderIds).values([...max].map(([user, id]) => ({ user, id: id + 1 })));
        await db.insert(tables.reminders).values(entries.flatMap((x) => (x.action === "remind" ? [{ ...x, client: secrets.DISCORD.CLIENT.ID }] : [])));
    }
});

await migrate("highlights", async () => {
    await db.delete(tables.highlights);
    const entries = await src.highlights.find().toArray();
    if (entries.length > 0)
        await db.insert(tables.highlights).values(
            entries.map((x) => ({
                guild: x.guild,
                user: x.user,
                phrases: x.phrases ?? [],
                replies: !!x.replies,
                cooldown: x.cooldown ?? 300000,
                delay: x.delay ?? 300000,
                blockedChannels: (x.blockedChannels ?? []).join("/"),
                blockedUsers: (x.blockedUsers ?? []).join("/"),
            })),
        );
});

await migrate("polls", async () => {
    await db.delete(tables.polls);
    await db.delete(tables.pollVotes);
    const entries = await src.polls.find().toArray();
    while (entries.length > 0) {
        const block = entries.splice(0, 500);
        await db.insert(tables.polls).values(
            block.map((x) => ({
                message: x.message,
                type: x.type,
                question: x.question,
                allowNeutral: "allowNeutral" in x ? x.allowNeutral : false,
                allowMulti: "allowMulti" in x ? x.allowMulti : false,
                leftOption: x.type === "binary" ? x.leftOption : "",
                rightOption: x.type === "binary" ? x.rightOption : "",
                options: x.type === "multi" ? x.options : [],
            })),
        );
        await db
            .insert(tables.pollVotes)
            .values(
                block.flatMap((x) =>
                    Object.entries(x.votes).map(([user, vote]) => ({ message: x.message, user, vote: Array.isArray(vote) ? JSON.stringify(vote) : vote })),
                ),
            );
    }
});

await migrate("sticky-messages", async () => {
    await db.delete(tables.stickyMessages);
    const entries = await src.stickyMessages.find().toArray();
    if (entries.length > 0) await db.insert(tables.stickyMessages).values(entries);
});

await migrate("cleanup", async () => {
    for (const { guild } of await db.select({ guild: tables.guildPremiumSettings.guild }).from(tables.guildPremiumSettings))
        await trpc.recalculateGuild.mutate(guild);
});

process.exit(0);
