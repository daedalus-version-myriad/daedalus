import { trpc } from "@daedalus/api";
import { DurationStyle, code, embed, expand, formatDuration, mdash, timeinfo } from "@daedalus/bot-utils";
import { AuditLogEvent, Client, Colors, Events } from "discord.js";
import { invokeLog } from "./lib";
import { channelUpdate, emojiUpdate, guildScheduledEventUpdate, guildUpdate, handleMemberUpdate, messageBulkDelete, messageDelete } from "./messages";
import { audit, auditEntry, channelTypes } from "./utils";

export function addEventHandlers(client: Client) {
    client
        .on(Events.ChannelCreate, (channel) => {
            invokeLog("channelCreate", channel, async () => {
                const user = await audit(channel.guild, AuditLogEvent.ChannelCreate, channel);
                return embed("Channel Created", `${expand(user, "System")} created ${expand(channel)}`, Colors.Green);
            });
        })
        .on(Events.ChannelDelete, (channel) => {
            if (channel.isDMBased()) return;

            invokeLog("channelDelete", channel, async () => {
                const user = await audit(channel.guild, AuditLogEvent.ChannelDelete, channel);

                return embed(
                    "Channel Deleted",
                    `${expand(user, "System")} deleted ${channelTypes[channel.type]} ${channel.name} (\`${channel.id}\`)`,
                    Colors.Red,
                );
            });
        })
        .on(Events.ChannelUpdate, (before, after) => {
            if (before.isDMBased() || after.isDMBased()) return;

            invokeLog("channelUpdate", after, async () => await channelUpdate(before, after));
        })
        .on(Events.GuildEmojiCreate, (emoji) => {
            invokeLog("emojiCreate", emoji.guild, async () => {
                const user = await audit(emoji.guild, AuditLogEvent.EmojiCreate);

                return {
                    embeds: [
                        {
                            title: "Emoji Created",
                            description: `${expand(user, "Unknown User")} created ${emoji} (:${emoji.name}: \`${emoji.id}\`)`,
                            color: Colors.Green,
                            thumbnail: { url: emoji.imageURL() },
                        },
                    ],
                };
            });
        })
        .on(Events.GuildEmojiDelete, (emoji) => {
            invokeLog("emojiDelete", emoji.guild, async () => {
                const user = await audit(emoji.guild, AuditLogEvent.EmojiDelete);

                return {
                    embeds: [
                        {
                            title: "Emoji Deleted",
                            description: `${expand(user, "Unknown User")} deleted :${emoji.name}: \`${emoji.id}\``,
                            color: Colors.Red,
                            thumbnail: { url: emoji.imageURL() },
                        },
                    ],
                };
            });
        })
        .on(Events.GuildEmojiUpdate, (before, after) => {
            invokeLog("emojiUpdate", after.guild, async () => await emojiUpdate(before, after));
        })
        .on(Events.GuildBanAdd, (ban) => {
            invokeLog("guildBanAdd", ban.guild, async () => {
                if (ban.partial) ban = await ban.fetch();

                const user = await audit(ban.guild, AuditLogEvent.MemberBanAdd, ban.user);

                return embed(
                    "User Banned",
                    `${expand(user, "Unknown User")} banned ${expand(ban.user)} ${ban.reason ? `with reason ${code(ban.reason)}` : ""}`,
                    Colors.Red,
                );
            });
        })
        .on(Events.GuildBanRemove, (ban) => {
            invokeLog("guildBanRemove", ban.guild, async () => {
                const entry = await auditEntry(ban.guild, AuditLogEvent.MemberBanRemove, ban.user);

                return embed(
                    "User Banned",
                    `${expand(entry?.executor, "Unknown User")} banned ${expand(ban.user)} ${entry?.reason ? `with reason ${code(entry.reason)}` : ""}`,
                    Colors.Green,
                );
            });
        })
        .on(Events.GuildMemberAdd, (member) => {
            invokeLog("guildMemberAdd", member.guild, async () =>
                embed(
                    "Member Joined",
                    `${expand(member)} just joined the server ${mdash} account was created ${formatDuration(Date.now() - member.user.createdTimestamp, DurationStyle.Blank)} ago ${member.user.bot ? `(added by ${expand(await audit(member.guild, AuditLogEvent.BotAdd, member), "Unknown User")})` : ""}`,
                    Colors.Green,
                ),
            );
        })
        .on(Events.GuildMemberRemove, async (member) => {
            invokeLog("guildMemberRemove", member.guild, async () =>
                embed(
                    "Member Left",
                    `${expand(member)} just left the server ${mdash} joined ${formatDuration(Date.now() - (member.joinedTimestamp ?? Date.now()), DurationStyle.Blank)} ago`,
                    Colors.Red,
                ),
            );

            const entry = await auditEntry(member.guild, AuditLogEvent.MemberKick, member);

            if (entry)
                invokeLog("guildMemberKick", member.guild, async () =>
                    embed(
                        "Member Kicked",
                        `${expand(entry.executor, "Unknown User")} kicked ${expand(member)} ${entry.reason ? `with reason ${code(entry.reason)}` : ""}`,
                        Colors.Red,
                    ),
                );
        })
        .on(Events.GuildMemberUpdate, async (before, after) => {
            await handleMemberUpdate(before, after);
        })
        .on(Events.GuildScheduledEventCreate, (event) => {
            if (!event.guild) return;

            invokeLog("guildScheduledEventCreate", event.channel ?? event.guild, () => {
                const url = event.coverImageURL({ size: 1024 });

                return {
                    embeds: [
                        {
                            title: "Event Created",
                            description: `${expand(event.creator, "Unknown User")} created the event ${code(event.name)} ${
                                event.channel ? `in ${expand(event.channel)}` : ""
                            }`,
                            color: Colors.Green,
                            image: url ? { url } : undefined,
                        },
                    ],
                };
            });
        })
        .on(Events.GuildScheduledEventDelete, (event) => {
            if (!event.guild) return;

            invokeLog("guildScheduledEventDelete", event.channel ?? event.guild, async () => {
                const user = await audit(event.guild!, AuditLogEvent.GuildScheduledEventDelete, event);
                const url = event.coverImageURL({ size: 1024 });

                return {
                    embeds: [
                        {
                            title: "Event Deleted",
                            description: `${expand(user, "Unknown User")} deleted the event ${event.name} ${
                                event.channel ? `in ${expand(event.channel)}` : ""
                            }`,
                            color: Colors.Red,
                            image: url ? { url } : undefined,
                        },
                    ],
                };
            });
        })
        .on(Events.GuildScheduledEventUpdate, (before, after) => {
            if (!before || !after.guild) return;

            invokeLog("guildScheduledEventUpdate", after.guild, async () => await guildScheduledEventUpdate(before, after));
        })
        .on(Events.GuildUpdate, (before, after) => {
            invokeLog("guildUpdate", after, async () => await guildUpdate(before, after));
        })
        .on(Events.InviteCreate, (invite) => {
            if (!invite.channel || !invite.guild || invite.channel.isDMBased()) return;

            invokeLog("inviteCreate", invite.guild, async () =>
                embed(
                    "Invite Created",
                    `${expand(invite.inviter, "System")} created discord.gg/${invite.code} to ${expand(invite.channel)} expiring ${
                        invite.expiresAt ? `at ${timeinfo(invite.expiresAt)}` : "never"
                    }`,
                    Colors.Green,
                ),
            );
        })
        .on(Events.InviteDelete, (invite) => {
            if (!invite.channel || !invite.guild || invite.channel.isDMBased()) return;
            const guild = invite.channel.guild;

            invokeLog("inviteDelete", invite.guild, async () => {
                const user = await audit(guild, AuditLogEvent.InviteDelete);

                return embed(
                    "Invite Deleted",
                    `${expand(user, "")} deleted discord.gg/${invite.code} (to ${expand(invite.channel)}) ${user ? "" : "was deleted"}`,
                    Colors.Red,
                );
            });
        })
        .on(Events.MessageDelete, (message) => {
            if (message.channel.isDMBased()) return;
            const guild = message.channel.guild;

            invokeLog("messageDelete", message.channel, async () => await messageDelete(message, await trpc.getFileOnlyMode.query(guild.id)));
        })
        .on(Events.MessageBulkDelete, (messages, channel) => {
            if (messages.size === 0) return;
            if (channel.isDMBased()) return;

            invokeLog("messageDeleteBulk", channel, async () => await messageBulkDelete(messages, await trpc.getFileOnlyMode.query(channel.guild.id)));
        });
}
