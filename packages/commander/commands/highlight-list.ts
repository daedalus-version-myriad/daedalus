import { trpc } from "@daedalus/api";
import { defer, type Commands } from "@daedalus/bot-utils";
import { formatDuration } from "@daedalus/global-utils";
import { Colors } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("highlight list")
            .description("list your highlights and show your highlight settings")
            .fn(defer(false))
            .fn(async ({ _ }) => {
                const { phrases, replies, cooldown, delay } = await trpc.getHighlightData.query({ guild: _.guild!.id, user: _.user.id });

                return {
                    embeds: [
                        {
                            title: "Highlights",
                            description: `${
                                phrases.length === 0
                                    ? "You have no phrases highlighted."
                                    : `You have the following highlighted:\n\n${phrases.map((phrase) => `- \`${phrase}\``).join("\n")}`
                            }\n\nYou have reply highlighting ${replies ? "on" : "off"}.`,
                            color: Colors.Blue,
                            fields: [
                                {
                                    name: "Delay",
                                    value: delay
                                        ? `The bot will wait until you have not sent any messages in a channel ${formatDuration(delay)} before notifying you.`
                                        : "The bot will notify you of all highlights even if you are active in the channel.",
                                },
                                {
                                    name: "Cooldown",
                                    value: cooldown
                                        ? `The bot will not notify you for the same channel within ${formatDuration(cooldown)}.`
                                        : "The bot will notify you for all highlighted messages without any cooldown.",
                                },
                            ],
                        },
                    ],
                };
            }),
    );
