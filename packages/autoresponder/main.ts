import { trpc } from "../api/index.js";
import { isModuleDisabled, isWrongClient, sendCustomMessage } from "../bot-utils/index.js";
import { Client, Events, type GuildBasedChannel } from "discord.js";

export const autoresponderHook = (client: Client) =>
    client.on(Events.MessageCreate, async (message) => {
        if (!message.guild || message.channel.isDMBased()) return;
        if (message.author.id === message.client.user.id) return;
        if (await isWrongClient(message.client, message.guild)) return;
        if (await isModuleDisabled(message.guild, "autoresponder")) return;

        const { triggers, ...config } = await trpc.getAutoresponderConfig.query(message.guild.id);
        if (triggers.length === 0) return;

        let channelAllowedByDefault: boolean | null = null;
        let roleAllowedByDefault: boolean | null = null;

        for (const trigger of triggers) {
            if (!trigger.enabled) continue;
            if (!trigger.respondToBotsAndWebhooks && message.author.bot) continue;
            if (trigger.replyMode === "none" && trigger.reaction === null) continue;

            const content = trigger.caseInsensitive ? message.content.toLowerCase() : message.content;
            const match = trigger.caseInsensitive ? trigger.match.toLowerCase() : trigger.match;

            if (trigger.wildcard ? !content.includes(match) : content !== match) continue;

            let allowed = !trigger.onlyInAllowedChannels;

            let channel: GuildBasedChannel | null = message.channel;

            do {
                if (trigger.blockedChannels.includes(channel.id)) {
                    allowed = false;
                    break;
                } else if (trigger.allowedChannels.includes(channel.id)) {
                    allowed = true;
                    break;
                }
            } while ((channel = channel.parent));

            if (!allowed) continue;

            if (message.member) {
                if (message.member!.roles.cache.hasAny(...trigger.blockedRoles)) continue;
                if (trigger.onlyToAllowedRoles && !message.member!.roles.cache.hasAny(...trigger.allowedRoles)) continue;
            }

            if (!trigger.bypassDefaultChannelSettings) {
                if (channelAllowedByDefault === null) {
                    channelAllowedByDefault = !config.onlyInAllowedChannels;

                    let channel: GuildBasedChannel | null = message.channel;

                    do {
                        if (config.blockedChannels.includes(channel.id)) {
                            channelAllowedByDefault = false;
                            break;
                        } else if (config.allowedChannels.includes(channel.id)) {
                            channelAllowedByDefault = true;
                            break;
                        }
                    } while ((channel = channel.parent));
                }

                if (!channelAllowedByDefault) continue;
            }

            if (message.member && !trigger.bypassDefaultRoleSettings) {
                if (roleAllowedByDefault === null)
                    roleAllowedByDefault =
                        !message.member!.roles.cache.hasAny(...config.blockedRoles) &&
                        (!config.onlyToAllowedRoles || message.member!.roles.cache.hasAny(...config.allowedRoles));

                if (!roleAllowedByDefault) continue;
            }

            if (trigger.replyMode !== "none")
                await sendCustomMessage(
                    trigger.replyMode === "normal" ? message.channel : message,
                    trigger.parsed,
                    "Autoresponder",
                    `Error responding to ${message.url}`,
                    { guild: message.guild, user: message.author, member: message.member },
                    false,
                    trigger.replyMode === "ping-reply",
                );

            if (trigger.reaction) await message.react(trigger.reaction).catch(() => null);
        }
    });
