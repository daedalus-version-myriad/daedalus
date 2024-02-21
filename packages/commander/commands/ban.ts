import { Colors } from "discord.js";
import { trpc } from "../../api/index.js";
import { checkPunishment, confirm, enforcePermissions, sendDM, template, timeinfo, type Commands } from "../../bot-utils/index.js";
import { DurationStyle, formatDuration, parseDuration } from "../../global-utils/index.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("ban")
            .description("ban a user from the server, even if they are not in the server")
            .userOption("user", "the user to ban", { required: true })
            .stringOption("reason", "the reason for banning (sent to the user + logged)", { maxLength: 512 })
            .stringOption("duration", `the duration of the ban (default: forever)`)
            .stringOption("purge", "the duration of chat history to purge from this user (default: 0, max: 7 days)")
            .booleanOption("silent", "if true, the user will not be notified")
            .booleanOption("force", "specify this to purge messages for a user who is already banned")
            .fn(async ({ _, user, reason, duration: _duration, purge: _purge, silent, force }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                await checkPunishment(_, user, "ban");

                reason ??= "";

                const duration = _duration ? parseDuration(_duration) : Infinity;
                const purge = _purge ? parseDuration(_purge) : 0;
                if (purge > 604800000) throw "Purge duration cannot exceed 7 days.";

                silent ??= false;
                force ??= false;

                if (!force)
                    try {
                        await _.guild.bans.fetch(user);

                        return template.error(
                            "That user is already banned, so this action will not do anything. Specify `force: true` to unban and re-ban them.",
                        );
                    } catch {}

                let inServer = true;

                try {
                    await _.guild.members.fetch({ user: user.id, force: true });
                } catch {
                    inServer = false;
                    silent = true;
                }

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm ${inServer ? "" : "pre-"}banning ${user.tag} ${formatDuration(duration)}`,
                                description: [
                                    inServer
                                        ? user.bot
                                            ? "This user is a bot and therefore cannot be notified."
                                            : `The user ${silent ? "will not" : "will"} be notified.`
                                        : "The user is not in the server and therefore will not be notified.",
                                ]
                                    .filter((x) => x)
                                    .join(" "),
                                color: Colors.DarkVividPink,
                                fields: reason ? [{ name: "Reason", value: reason }] : [],
                                footer: { text: user.id },
                            },
                        ],
                    },
                    300000,
                );

                if (!response) return;

                await response.deferUpdate();
                await enforcePermissions(_.user, "ban", _.channel!);
                await checkPunishment(response, user, "ban");
                const { banFooter, embedColor } = await trpc.getBanFooterAndEmbedColor.query(_.guild.id);

                let unban: Date | undefined;
                if (duration !== Infinity) unban = new Date(Date.now() + duration);

                const status = await sendDM(_, user, silent, {
                    embeds: [
                        {
                            title: `You were __banned__ from **${_.guild.name}** ${formatDuration(duration)}`,
                            description: unban ? `Your ban will automatically expire on ${timeinfo(unban)}.` : "",
                            color: embedColor,
                            fields: [reason ? { name: "Reason", value: reason } : [], banFooter ? { name: "_ _", value: banFooter } : []].flat(),
                        },
                    ],
                });

                if (force) await _.guild.bans.remove(user, "forcing re-ban").catch(() => {});

                await _.guild.bans.create(user, { deleteMessageSeconds: purge / 1000, reason });

                const id = await trpc.addUserHistory.mutate({
                    guild: _.guild.id,
                    user: user.id,
                    type: "ban",
                    mod: _.user.id,
                    duration,
                    origin: response.message.url,
                    reason,
                });

                if (unban) await trpc.setModerationRemovalTask.mutate({ guild: _.guild.id, user: user.id, action: "unban", time: unban.getTime() });
                else await trpc.removeModerationRemovalTask.mutate({ guild: _.guild.id, user: user.id, action: "unban" });

                await response.editReply({
                    embeds: [
                        {
                            title: `${inServer ? "Banned" : "Pre-banned"} ${user.tag} ${formatDuration(duration)}`,
                            description: `This is case #${id}. ${status}${
                                unban ? ` This ban will automatically be removed on ${timeinfo(unban)}.` : ""
                            }${purge ? ` ${formatDuration(purge, DurationStyle.Blank)} of messages were purged.` : ""}`,
                            color: Colors.Green,
                            fields: reason ? [{ name: "Reason", value: reason }] : [],
                            footer: { text: user.id },
                        },
                    ],
                    components: [],
                });
            }),
    );
