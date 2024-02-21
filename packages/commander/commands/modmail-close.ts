import { trpc } from "../../api/index.js";
import { defer, getColor, timeinfo, type Commands } from "../../bot-utils/index.js";
import { parseDuration } from "../../global-utils/index.js";
import { closeModmailThread, getModmailContactInfo } from "../../modmail/index.js";
import { escapeMarkdown } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail close")
            .description("close a modmail thread")
            .booleanOption("notify", "if true, notify the user that the modmail thread has been closed")
            .stringOption("content", "the content for the notification; also stored in the logs (leave blank to use the server default)", { maxLength: 4000 })
            .stringOption("delay", "how long to wait before auto-closing (recipient is always notified; cancels if a message is sent)")
            .fn(defer(false))
            .fn(async ({ _, notify, content, delay: _delay }) => {
                const delay = _delay ? parseDuration(_delay, false) : 0;

                if (delay > 0) {
                    const { member } = await getModmailContactInfo(false)({ _ });
                    const time = Date.now() + delay;

                    await trpc.setModmailAutoclose.mutate({
                        guild: _.guild!.id,
                        channel: _.channel!.id,
                        author: _.user.id,
                        notify: !!notify,
                        message: content ?? "",
                        time,
                    });

                    await member
                        .send({
                            embeds: [
                                {
                                    title: `Modmail Thread Close Scheduled: **${escapeMarkdown(_.guild!.name)}**`,
                                    description: `This thread will be closed at ${timeinfo(time)} unless you or the server staff send another message.`,
                                    color: await getColor(_.guild!),
                                    footer: { text: `Server ID: ${_.guild!.id}` },
                                },
                            ],
                        })
                        .catch(() => {
                            throw `The user could not be notified. They may have DMs off or have blocked the bot. The thread will still automatically close at ${timeinfo(
                                time,
                            )}${notify ? " unless notifying them at the time of closing fails again" : ""}.`;
                        });

                    return {
                        embeds: [
                            {
                                title: "Modmail Thread Close Scheduled",
                                description: `This thread will be closed at ${timeinfo(time)} unless you or the recipient sends another message.`,
                                color: await getColor(_.guild!),
                            },
                        ],
                    };
                }

                await closeModmailThread(_, _.user.id, !!notify, content ?? "");
            }),
    );
