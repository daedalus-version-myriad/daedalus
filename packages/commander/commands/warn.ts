import { trpc } from "../../api/index.js";
import { checkPunishment, confirm, dmStatuses, enforcePermissions, getColor, sendDM, template, type Commands } from "../../bot-utils/index.js";
import { Colors, type GuildMember } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("warn")
            .description("send a DM warning to a member")
            .userOption("user", "the user to warn", { required: true })
            .stringOption("reason", "the reason for warning (sent to the user + logged)", { required: true, maxLength: 512 })
            .booleanOption("informal", "if true, the warning will be marked as informal to the user and in their user history")
            .booleanOption("silent", "if true, the user will not receive a notification")
            .fn(async ({ _, user, reason, informal, silent }) => {
                if (!_.guild) throw "This command can only be run in a guild.";
                if (user.bot) throw "You cannot warn bots, as bots cannot DM each other. If you want to keep notes on bots, use the notes feature.";

                await checkPunishment(_, user, "warn");

                silent ??= false;
                informal ??= false;

                let member: GuildMember | undefined;

                try {
                    member = await _.guild.members.fetch({ user: user.id, force: true });
                } catch {
                    if (!silent) throw "You can only warn users who are in the server. Enable `silent` to add warnings to a non-member without notifying them.";
                }

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm ${informal ? "in" : ""}formally warning ${user.tag}`,
                                description: silent ? "The user will not be notified." : "The user will be DM'd your warning.",
                                color: Colors.DarkVividPink,
                                fields: [{ name: "Reason", value: reason }],
                                footer: { text: user.id },
                            },
                        ],
                    },
                    300000,
                );

                if (!response) return;

                await response.deferUpdate();
                await enforcePermissions(_.user, "warn", _.channel!);
                if (member) await checkPunishment(response, member, "warn");

                const status = await sendDM(_, user, silent, {
                    embeds: [
                        {
                            title: `You were ${informal ? "in" : ""}formally __warned__ in **${_.guild.name}**`,
                            color: await getColor(_.guild),
                            fields: [{ name: "Reason", value: reason }],
                        },
                    ],
                });

                if (status === dmStatuses.failed) {
                    await response.editReply(template.error(status));
                    return;
                }

                const id = await trpc.addUserHistory.mutate({
                    guild: _.guild.id,
                    user: user.id,
                    type: `${informal ? "informal_" : ""}warn`,
                    mod: _.user.id,
                    origin: response.message.url,
                    reason,
                });

                await response.editReply({
                    embeds: [
                        {
                            title: `Warned ${user.tag} ${informal ? "in" : ""}formally`,
                            description: `This is case #${id}. ${status}`,
                            color: Colors.Green,
                            fields: [{ name: "Reason", value: reason }],
                            footer: { text: user.id },
                        },
                    ],
                    components: [],
                });
            }),
    );
