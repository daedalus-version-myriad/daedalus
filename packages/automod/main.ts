import { trpc } from "@daedalus/api";
import { expand, getMuteRole, isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { englishList } from "@daedalus/formatting";
import { formatDuration } from "@daedalus/global-utils";
import { logError } from "@daedalus/log-interface";
import { Client, Events, IntentsBitField, Partials, type Message, type PartialMessage, type TextBasedChannel } from "discord.js";
import { match, skip, type Rule } from "./lib";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
            partials: [Partials.Channel, Partials.Message],
            sweepers: { messages: { lifetime: 600, interval: 3600 } },
            allowedMentions: { parse: [] },
        }),
    postprocess: (client) => client.on(Events.MessageCreate, check).on(Events.MessageUpdate, async (_, message) => await check(message)),
});

async function check(message: Message | PartialMessage) {
    if (!message.guild) return;
    if (message.author?.id === message.client.user.id) return;
    // TODO: if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    if (await isWrongClient(message.client, message.guild)) return;
    if (await isModuleDisabled(message.guild, "automod")) return;

    if (message.webhookId && (await message.fetchWebhook().catch(() => null))?.isChannelFollower()) return;

    const config = await trpc.getAutomodConfig.query(message.guild.id);

    const actionDurations: Partial<Record<Rule["additionalAction"], number>> = {};
    const reports = new Map<string, { rule: Rule; report: string; notified: boolean }[]>();
    const notifs: string[] = [];

    let willDelete = false,
        willNotify = false,
        caught = false;

    const multiDeleteTargets: Message[] = [];

    let fetched: Message;
    if (!message.partial) fetched = message;

    for (const rule of config.rules) {
        if (!rule.reportToChannel && !rule.deleteMessage && !rule.notifyAuthor) continue;
        if (skip(message, rule, config)) continue;
        fetched ??= await message.fetch();

        const result = await match(rule, fetched, multiDeleteTargets);
        console.log(result);
        if (!result) continue;

        const [notif, report] = result;

        caught = true;
        actionDurations[rule.additionalAction] = Math.max(actionDurations[rule.additionalAction] ?? 0, rule.actionDuration || Infinity);

        if (rule.notifyAuthor) notifs.push(notif.trim());
        willDelete ||= rule.deleteMessage;
        willNotify ||= rule.notifyAuthor;

        if (rule.reportToChannel) {
            const key = rule.reportChannel || config.defaultChannel;

            if (key) {
                if (!reports.has(key)) reports.set(key, []);
                reports.get(key)!.push({ rule, report, notified: rule.notifyAuthor });
            }
        }
    }

    if (!caught) return;

    if (multiDeleteTargets.length > 0) {
        const groups = new Map<string, Message[]>();
        const channels = new Map<string, TextBasedChannel>();

        for (const target of multiDeleteTargets) {
            if (!groups.has(target.channel.id)) {
                groups.set(target.channel.id, []);
                channels.set(target.channel.id, target.channel);
            }

            groups.get(target.channel.id)!.push(target);
        }

        for (const [channelId, messageList] of groups)
            try {
                if (messageList.length === 1) await messageList[0].delete();
                else {
                    const channel = channels.get(channelId);
                    if (channel?.isTextBased() && !channel.isDMBased()) await channel.bulkDelete(messageList);
                }
            } catch {}
    }

    if (willDelete && !multiDeleteTargets.some((x) => x.id === message.id)) await message.delete().catch(() => null);

    const actions: Exclude<Rule["additionalAction"], "nothing">[] = [];

    if (actionDurations.timeout !== undefined)
        if (actionDurations.mute !== undefined) actions.push(actionDurations.mute > actionDurations.timeout ? "mute" : "timeout");
        else actions.push("timeout");
    else if (actionDurations.mute !== undefined) actions.push("mute");

    if (actionDurations.ban !== undefined) {
        actions.push("ban");

        for (const key of ["mute", "timeout"] as const)
            if (
                actionDurations.ban === Infinity ||
                (actions.includes(key) && actionDurations[key] !== Infinity && actionDurations.ban >= actionDurations[key]!)
            )
                actions.splice(actions.indexOf(key), 1);
    } else if (actionDurations.kick !== undefined) actions.push("kick");

    if (actions.length === 0 && actionDurations.warn !== undefined) actions.push("warn");

    const actionString = englishList(
        actions.map((x) => `${past[x]}${["mute", "timeout", "ban"].includes(x) ? ` ${formatDuration(actionDurations[x]!)}` : ""}`),
    );

    let notified = false;
    let report: Message | undefined;

    const { banFooter, embedColor } = await trpc.getBanFooterAndEmbedColor.query(message.guild.id);

    if (willNotify && !message.author?.bot) {
        try {
            await message.author?.send({
                embeds: [
                    {
                        title: "Automod Action Taken",
                        description: `Your message was deleted by automod. ${
                            actions.length > 0
                                ? actionString === past.warn
                                    ? "This is a formal (logged) warning."
                                    : `As a result, you were ${actionString}.`
                                : "No further action was taken; this is just an (unlogged) notice."
                        }\n\n**Details:**\n${notifs.join(" ")}`.slice(0, 4096),
                        color: embedColor,
                        footer: { text: willDelete ? "Your message was deleted." : "" },
                    },
                    ...(actions.includes("ban") && banFooter ? [{ description: banFooter, color: embedColor }] : []),
                ],
            });

            notified = true;
        } catch {}
    }

    for (const [channelId, data] of reports)
        try {
            const channel = await message.guild.channels.fetch(channelId);
            if (!channel?.isTextBased()) continue;

            report = await channel.send({
                embeds: [
                    {
                        title: "Automod Action Taken",
                        description: `${expand(message.author)} triggered the ${englishList(data.map((item) => item.rule.name))} rule${
                            data.length === 1 ? "" : "s"
                        }${
                            actions.length > 0
                                ? ` and was ${actionString}`
                                : willNotify
                                  ? notified
                                      ? " and was notified (but no history was logged)"
                                      : " but could not be notified"
                                  : ""
                        }.`,
                        color: embedColor,
                        fields: [
                            {
                                name: "Details",
                                value: data
                                    .map((item) => item.report)
                                    .join(" ")
                                    .slice(0, 1024),
                            },
                        ],
                        footer: {
                            text: [
                                willNotify
                                    ? notified
                                        ? "The user was notified of this action."
                                        : message.author?.bot
                                          ? "The message was sent by a bot so no notification could be sent."
                                          : "The user could not be notified; they may have DMs closed or may have blocked the bot."
                                    : [],
                                willDelete ? "The message was deleted." : [],
                            ]
                                .flat()
                                .join(" "),
                        },
                        url: message.url,
                    },
                ],
            });
        } catch {}

    if (!message.webhookId)
        try {
            if (actions.includes("mute")) {
                try {
                    const muteRole = await getMuteRole(message.guild);
                    await message.member?.roles.add(muteRole, "Automod Action");
                } catch (error) {
                    logError(message.guild.id, "Automod Mute Action", `Automod was not able to mute ${message.author}: ${error}`);
                }

                if (actionDurations.mute === 0)
                    await trpc.removeModerationRemovalTask.mutate({ guild: message.guild.id, user: message.author!.id, action: "unmute" });
                else
                    await trpc.setModerationRemovalTask.mutate({
                        guild: message.guild.id,
                        user: message.author!.id,
                        action: "unmute",
                        time: Date.now() + actionDurations.mute!,
                    });
            }

            if (actions.includes("timeout") && message.member?.moderatable)
                message.member.disableCommunicationUntil(Date.now() + actionDurations.timeout!, "Automod Action");

            if (actions.includes("kick") && message.member?.kickable) message.member.kick("Automod Action");

            if (actions.includes("ban") && message.member?.bannable) {
                message.member.ban({ reason: "Automod Action" });

                if (actionDurations.ban === 0)
                    await trpc.removeModerationRemovalTask.mutate({ guild: message.guild.id, user: message.author!.id, action: "unban" });
                else
                    await trpc.setModerationRemovalTask.mutate({
                        guild: message.guild.id,
                        user: message.author!.id,
                        action: "unban",
                        time: Date.now() + actionDurations.ban!,
                    });
            }

            if (actions.length === 1)
                await trpc.addUserHistory.mutate({
                    guild: message.guild.id,
                    user: message.author!.id,
                    type: actions[0],
                    mod: message.client.user.id,
                    duration: ["mute", "timeout", "ban"].includes(actions[0]) ? actionDurations[actions[0]] || Infinity : undefined,
                    origin: report?.url,
                    reason: "Automod Action",
                });
            else if (actions.length > 1)
                await trpc.addUserHistory.mutate({
                    guild: message.guild.id,
                    user: message.author!.id,
                    type: "bulk",
                    mod: message.client.user.id,
                    duration:
                        actions
                            .filter((x) => ["mute", "timeout", "ban"].includes(x))
                            .map((x) => actionDurations[x])
                            .reduce((x, y) => Math.max(x || Infinity, y || Infinity), 0) || undefined,
                    origin: report?.url,
                    reason: `Automod Actions: ${actions.join(", ")}`,
                });
        } catch {}
}

const past = {
    nothing: "",
    warn: "warned",
    mute: "muted",
    timeout: "timed out",
    kick: "kicked",
    ban: "banned",
} as const;
