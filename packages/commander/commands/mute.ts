import { trpc } from "@daedalus/api";
import { checkPunishment, confirm, enforcePermissions, getColor, getMuteRole, isModuleDisabled, sendDM, timeinfo, type Commands } from "@daedalus/bot-utils";
import { formatDuration, parseDuration } from "@daedalus/global-utils";
import { Colors, type GuildMember } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("mute")
            .description("mute a user by assigning them the mute role")
            .userOption("user", "the user to mute", { required: true })
            .stringOption("reason", "the reason for muting (sent to the user + logged)", { maxLength: 512 })
            .stringOption("duration", "the duration of the mute (default: forever)")
            .booleanOption("silent", "if true, the user will not be notified")
            .fn(async ({ _, user, reason, duration: _duration, silent }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                await getMuteRole(_.guild);
                await checkPunishment(_, user, "mute");

                reason ??= "";

                const duration = _duration ? parseDuration(_duration) : Infinity;

                silent ??= false;

                let member: GuildMember | undefined;

                try {
                    member = await _.guild.members.fetch({ user: user.id, force: true });
                } catch {
                    if (await isModuleDisabled(_.guild.id, "sticky-roles"))
                        throw "That user is not in the server. Enable the Sticky Roles module to enable muting non-members.";
                }

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm ${member ? "" : "pre-"}muting ${user.tag} ${formatDuration(duration)}`,
                                description: member
                                    ? user.bot
                                        ? "This user is a bot and therefore cannot be notified."
                                        : `The user ${silent ? "will not" : "will"} be notified.`
                                    : "The user is not in the server and therefore will not be notified.",
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
                await enforcePermissions(_.user, "mute", _.channel!);
                await checkPunishment(response, user, "mute");
                const role = await getMuteRole(_.guild);

                let unmute: Date | undefined;
                if (duration !== Infinity) unmute = new Date(Date.now() + duration);

                if (member) await member.roles.add(role, reason);
                else if (await isModuleDisabled(_.guild.id, "sticky-roles"))
                    throw "That user is not in the server. Enable the Sticky Roles module to enable muting non-members.";
                else await trpc.addStickyRole.mutate({ guild: _.guild.id, user: user.id, role: role.id });

                const status = await sendDM(_, user, silent, {
                    embeds: [
                        {
                            title: `You were __muted__ in **${_.guild.name}** ${formatDuration(duration)}`,
                            description: unmute ? `Your mute will automatically expire on ${timeinfo(unmute)}.` : "",
                            color: await getColor(_.guild),
                            fields: reason ? [{ name: "Reason", value: reason }] : [],
                        },
                    ],
                });

                const id = await trpc.addUserHistory.mutate({
                    guild: _.guild.id,
                    user: user.id,
                    type: "mute",
                    mod: _.user.id,
                    duration,
                    origin: response.message.url,
                    reason,
                });

                if (unmute) await trpc.setModerationRemovalTask.mutate({ guild: _.guild.id, user: user.id, action: "unmute", time: unmute.getTime() });
                else await trpc.removeModerationRemovalTask.mutate({ guild: _.guild.id, user: user.id, action: "unmute" });

                await response.editReply({
                    embeds: [
                        {
                            title: `${member ? "Muted" : "Pre-muted"} ${user.tag} ${formatDuration(duration)}`,
                            description: `This is case #${id}. ${status}${unmute ? ` This mute will automatically be removed on ${timeinfo(unmute)}.` : ""}`,
                            color: Colors.Green,
                            fields: reason ? [{ name: "Reason", value: reason }] : [],
                            footer: { text: user.id },
                        },
                    ],
                    components: [],
                });
            }),
    );
