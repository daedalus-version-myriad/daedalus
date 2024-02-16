import { trpc } from "@daedalus/api";
import { checkPunishment, confirm, enforcePermissions, getColor, sendDM, timeinfo, type Commands } from "@daedalus/bot-utils";
import { formatDuration, parseDuration } from "@daedalus/global-utils";
import { Colors, type GuildMember } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("timeout")
            .description("timeout a member or remove their timeout")
            .userOption("user", "the user to timeout", { required: true })
            .stringOption("reason", "the reason for timing out (sent to the user + logged)", { maxLength: 512 })
            .stringOption("duration", "the duration of the timeout (default: 0s = remove)")
            .booleanOption("silent", "if true, the user will not be notified")
            .fn(async ({ _, user, reason, duration: _duration, silent }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                await checkPunishment(_, user, "timeout");

                reason ??= "";

                const duration = _duration ? parseDuration(_duration, false) : 0;
                if (duration > 2419200000) throw "Timeout duration cannot exceed 28 days.";

                silent ??= false;

                let member: GuildMember;

                try {
                    member = await _.guild.members.fetch({ user: user.id, force: true });
                } catch {
                    throw `You can only ${duration > 0 ? "timeout" : "remove the timeout for"} users who are in this server.`;
                }

                if (duration === 0 && !member.isCommunicationDisabled()) throw `${member} is not currently timed out.`;

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: duration ? `Confirm timing out ${user.tag} for ${formatDuration(duration)}` : `Confirm removing ${user.tag}'s timeout`,
                                description: user.bot
                                    ? "The user is a bot and therefore cannot be notified."
                                    : `The user ${silent ? "will not" : "will"} be notified.`,
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
                await enforcePermissions(_.user, "timeout", _.channel!);
                await checkPunishment(response, user, "timeout");

                if (duration) {
                    const until = new Date(Date.now() + duration);
                    await member.disableCommunicationUntil(until, reason);

                    const status = await sendDM(_, user, silent, {
                        embeds: [
                            {
                                title: `You were __timed out__ in **${_.guild.name}** ${formatDuration(duration)}`,
                                description: `Your timeout will automatically expire on ${timeinfo(until)}.`,
                                color: await getColor(_.guild),
                                fields: reason ? [{ name: "Reason", value: reason }] : [],
                            },
                        ],
                    });

                    const id = await trpc.addUserHistory.mutate({
                        guild: _.guild.id,
                        user: user.id,
                        type: "timeout",
                        mod: _.user.id,
                        duration,
                        origin: response.message.url,
                        reason,
                    });

                    await response.editReply({
                        embeds: [
                            {
                                title: `Timed out ${user.tag} ${formatDuration(duration)}`,
                                description: `This is case #${id}. ${status} This timeout will automatically be removed on ${timeinfo(until)}.`,
                                color: Colors.Green,
                                fields: reason ? [{ name: "Reason", value: reason }] : [],
                                footer: { text: user.id },
                            },
                        ],
                        components: [],
                    });
                } else {
                    await member.disableCommunicationUntil(null, reason);

                    const status = await sendDM(_, user, silent, {
                        embeds: [
                            {
                                title: `Your timeout in **${_.guild.name}** was removed.`,
                                description: "You are able to interact again.",
                                color: await getColor(_.guild),
                                fields: reason ? [{ name: "Reason", value: reason }] : [],
                            },
                        ],
                    });

                    await response.editReply({
                        embeds: [
                            {
                                title: `Remvoed ${user.tag}'s timeout`,
                                description: status,
                                color: Colors.Green,
                                fields: reason ? [{ name: "Reason", value: reason }] : [],
                                footer: { text: user.id },
                            },
                        ],
                        components: [],
                    });
                }
            }),
    );
