import { Colors } from "discord.js";
import { trpc } from "../../api/index.js";
import { Commands, template, timeinfo, truncate } from "../../bot-utils/index.js";
import { parseDuration } from "../../global-utils/index.js";

export default (x: Commands) =>
    x
        .slash((x) =>
            x
                .key("reminder set")
                .description("set a reminder")
                .stringOption("duration", "how long to wait before reminding you", { required: true })
                .stringOption("query", "the reminder message to include", { maxLength: 1024 })
                .fn(async ({ _, duration: _duration, query }) => {
                    if ((await trpc.countReminders.query(_.user.id)) >= 20) throw "You have reached the global reminder limit (20).";

                    const duration = parseDuration(_duration, true);
                    if (duration === 0) throw "You must set the reminder in the future.";
                    if (duration === Infinity) throw "You must set the duration to a finite amount of time.";

                    const time = Date.now() + duration;
                    const id = await trpc.getNextReminderId.mutate(_.user.id);

                    const reply = await _.reply({
                        embeds: [
                            {
                                title: `Reminder Set (#${id})`,
                                description: `You will be reminded on ${timeinfo(time)}${query ? ` about ${truncate(query, 256)}` : ""}`,
                                color: Colors.Green,
                            },
                        ],
                        fetchReply: true,
                    });

                    await trpc.setReminder.mutate({
                        guild: _.guild?.id ?? null,
                        id,
                        client: _.client.user.id,
                        user: _.user.id,
                        query,
                        origin: reply.url,
                        time,
                    });
                }),
        )
        .slash((x) =>
            x
                .key("reminder list")
                .description("list your reminders")
                .booleanOption("all", "if true, list reminders that you set in other servers")
                .fn(async ({ _, all }) => {
                    all ??= !_.guild;

                    const reminders = await trpc.listReminders.query({ user: _.user.id, guild: all ? undefined : _.guild?.id ?? null });
                    if (reminders.length === 0) return template.info(`You have no reminders${all ? "" : " in this server"}.`);

                    return {
                        embeds: [
                            {
                                title: "Reminders",
                                description: reminders
                                    .map((x) => `- \`${x.id}\`: [here](${x.origin}) at ${timeinfo(x.time)}${x.query ? `: ${truncate(x.query, 100)}` : ""}`)
                                    .join("\n"),
                                color: Colors.Blue,
                            },
                        ],
                    };
                }),
        )
        .slash((x) =>
            x
                .key("reminder cancel")
                .description("delete a reminder")
                .numberOption("id", "the ID of the reminder to delete", { required: true, minimum: 1 })
                .fn(async ({ _, id }) => {
                    const entry = await trpc.cancelReminder.mutate({ user: _.user.id, id });
                    if (!entry) throw "That reminder does not exist.";
                    return template.success(`Deleted reminder #${id} set [here](${entry.origin}).`);
                }),
        );
