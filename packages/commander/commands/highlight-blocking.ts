import { trpc } from "../../api/index.js";
import { template, type Commands } from "../../bot-utils/index.js";
import { ChannelType, Colors } from "discord.js";

export default (x: Commands) =>
    x
        .slash((x) =>
            x
                .key("highlight block user")
                .description("highlight-block a user")
                .userOption("user", "the user to block", { required: true })
                .fn(async ({ _, user }) => {
                    const alreadyBlocked = await trpc.highlightBlock.mutate({ guild: _.guild!.id, user: _.user.id, target: user.id, key: "blockedUsers" });

                    if (alreadyBlocked) throw `You already have ${user} blocked for highlights.`;
                    return template.success(`Blocked highlights from ${user}.`);
                }),
        )
        .slash((x) =>
            x
                .key("highlight block channel")
                .description("highlight-block a channel")
                .channelOption("channel", "the channel to block", {
                    required: true,
                    channelTypes: [
                        ChannelType.AnnouncementThread,
                        ChannelType.GuildForum,
                        ChannelType.GuildStageVoice,
                        ChannelType.GuildText,
                        ChannelType.GuildVoice,
                        ChannelType.PrivateThread,
                        ChannelType.PublicThread,
                    ],
                })
                .fn(async ({ _, channel }) => {
                    const alreadyBlocked = await trpc.highlightBlock.mutate({
                        guild: _.guild!.id,
                        user: _.user.id,
                        target: channel.id,
                        key: "blockedChannels",
                    });

                    if (alreadyBlocked) throw `You already have ${channel} blocked for highlights.`;
                    return template.success(`Blocked highlights in ${channel}.`);
                }),
        )
        .slash((x) =>
            x
                .key("highlight unblock user")
                .description("highlight-unblock a user")
                .userOption("user", "the user to unblock", { required: true })
                .fn(async ({ _, user }) => {
                    const notBlocked = await trpc.highlightUnblock.mutate({ guild: _.guild!.id, user: _.user.id, target: user.id, key: "blockedUsers" });

                    if (notBlocked) throw `You already do not have ${user} blocked for highlights.`;
                    return template.success(`Unblocked highlights from ${user}.`);
                }),
        )
        .slash((x) =>
            x
                .key("highlight unblock channel")
                .description("highlight-unblock a channel")
                .channelOption("channel", "the channel to unblock", {
                    required: true,
                    channelTypes: [
                        ChannelType.AnnouncementThread,
                        ChannelType.GuildForum,
                        ChannelType.GuildStageVoice,
                        ChannelType.GuildText,
                        ChannelType.GuildVoice,
                        ChannelType.PrivateThread,
                        ChannelType.PublicThread,
                    ],
                })
                .fn(async ({ _, channel }) => {
                    const notBlocked = await trpc.highlightUnblock.mutate({ guild: _.guild!.id, user: _.user.id, target: channel.id, key: "blockedChannels" });

                    if (notBlocked) throw `You already do not have ${channel} blocked for highlights.`;
                    return template.success(`Unblocked highlights in ${channel}.`);
                }),
        )
        .slash((x) =>
            x
                .key("highlight block list")
                .description("list your blocked users and channels")
                .fn(async ({ _ }) => {
                    const { blockedUsers, blockedChannels } = await trpc.getHighlightData.query({ guild: _.guild!.id, user: _.user.id });

                    try {
                        await _.reply({
                            embeds: [
                                {
                                    title: "Highlight Block List",
                                    color: Colors.Blue,
                                    fields: [
                                        { name: "Blocked Members", value: blockedUsers.map((x) => `<@${x}>`).join(", ") || "(none)" },
                                        { name: "Blocked Channels", value: blockedChannels.map((x) => `<#${x}>`).join(", ") || "(none)" },
                                    ],
                                },
                            ],
                            ephemeral: true,
                        });
                    } catch {
                        await _.reply({
                            files: [
                                {
                                    name: "blocklist.txt",
                                    attachment: Buffer.from(
                                        `Blocked Members: ${
                                            blockedUsers.map((x) => _.guild!.members.cache.get(x)?.user.tag ?? `(unknown user: ${x})`).join(", ") || "(none)"
                                        }\n\nBlocked Channels: ${
                                            blockedChannels.map((x) => _.guild!.channels.cache.get(x)?.name ?? `(unknown channel: ${x})`).join(", ") || "(none)"
                                        }`,
                                        "utf-8",
                                    ),
                                },
                            ],
                            ephemeral: true,
                        });
                    }
                }),
        )
        .slash((x) =>
            x
                .key("highlight unblock all")
                .description("clear your highlight block list")
                .fn(async ({ _ }) => {
                    await trpc.clearHighlightBlockList.mutate({ guild: _.guild!.id, user: _.user.id });
                    return template.success("Cleared your highlight block list.");
                }),
        );
