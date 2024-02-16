import { trpc } from "@daedalus/api";
import { confirm, enforcePermissions, getColor, getMuteRole, isModuleDisabled, sendDM, type Commands } from "@daedalus/bot-utils";
import { Colors, type GuildMember } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("unmute")
            .description("unmute a user by removing the mute role from them")
            .userOption("user", "the user to unmute", { required: true })
            .stringOption("reason", "the reason for unmuting (sent to the user + audit logged)")
            .booleanOption("silent", "if true, the user will not be notified")
            .fn(async ({ _, user, reason, silent }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                silent ??= false;

                await getMuteRole(_.guild);

                let member: GuildMember | undefined;

                try {
                    member = await _.guild.members.fetch({ user: user.id, force: true });
                } catch {
                    if (await isModuleDisabled(_.guild.id, "sticky-roles"))
                        throw "That user is not in the server. Enable the Sticky Roles module to enable unmuting non-members.";
                }

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm unmuting ${user.tag}`,
                                description: `The user ${silent ? "will not" : "will"} be notified.`,
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
                await enforcePermissions(_.user, "unmute", _.channel!);
                const role = await getMuteRole(_.guild);

                if (member) await member.roles.remove(role, reason ?? undefined);
                else if (await isModuleDisabled(_.guild.id, "sticky-roles"))
                    throw "That user is not in the server. Enable the Sticky Roles module to enable unmuting non-members.";
                else await trpc.deleteStickyRole.mutate({ guild: _.guild.id, user: user.id, role: role.id });

                const status = await sendDM(_, user, silent, {
                    embeds: [
                        {
                            title: `You were unmuted in **${_.guild.name}**`,
                            description: "You are able to interact again.",
                            color: await getColor(_.guild),
                            fields: reason ? [{ name: "Reason", value: reason }] : [],
                        },
                    ],
                });

                await trpc.removeModerationRemovalTask.mutate({ guild: _.guild.id, user: user.id, action: "unmute" });

                await response.editReply({
                    embeds: [
                        {
                            title: `Unmuted ${user.tag}`,
                            description: status,
                            color: Colors.Green,
                            fields: reason ? [{ name: "Reason", value: reason }] : [],
                            footer: { text: user.id },
                        },
                    ],
                    components: [],
                });
            }),
    );
