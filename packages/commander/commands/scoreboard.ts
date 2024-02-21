import { trpc } from "../../api/index.js";
import { defer, type Commands, getColor } from "../../bot-utils/index.js";
import { ChannelType } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("scoreboard")
            .description("view the count channel scoreboard for a channel or the whole server")
            .channelOption("channel", "the channel for which to view the scoreboard", {
                channelTypes: [
                    ChannelType.AnnouncementThread,
                    ChannelType.GuildAnnouncement,
                    ChannelType.GuildText,
                    ChannelType.GuildVoice,
                    ChannelType.PrivateThread,
                    ChannelType.PublicThread,
                ],
            })
            .numberOption("page", "the page to view (default = 1)", { minimum: 1 })
            .fn(defer(false))
            .fn(async ({ _, channel, page }) => {
                let scores: { user: string; score: number }[];

                if (channel) {
                    const counter = await trpc.getCountChannel.query({ guild: channel.guild.id, channel: channel.id });
                    if (!counter) throw "That is not a count channel.";

                    scores = await trpc.getScoreboard.query({ id: counter.id, page: page ?? 1 });
                } else {
                    scores = (await trpc.getGuildScoreboard.query({ guild: _.guild!.id, page: page ?? 1 })).map(({ user, score }) => ({
                        user,
                        score: +score!,
                    }));
                }

                if (scores.length === 0) throw "This scoreboard page is empty!";

                return {
                    embeds: [
                        {
                            title: "Count Scoreboard",
                            description: `${channel ?? "Server-Wide"}\n\n${scores.map(({ user, score }, index) => `\`${index + (page ?? 1) * 20 - 19}.\` <@${user}>: \`${score}\``).join("\n")}`,
                            color: await getColor(_.guild!),
                        },
                    ],
                };
            }),
    );
