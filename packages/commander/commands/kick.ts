import { trpc } from "../../api/index.js";
import { checkPunishment, confirm, enforcePermissions, getColor, sendDM, type Commands } from "../../bot-utils/index.js";
import { Colors, type GuildMember } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("kick")
            .description("kick a member from the server")
            .userOption("user", "the user to kick", { required: true })
            .stringOption("reason", "the reason for kicking (sent to the user + logged)", { maxLength: 512 })
            .booleanOption("silent", "if true, the user will not be notified")
            .fn(async ({ _, user, reason, silent }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                await checkPunishment(_, user, "kick");

                reason ??= "";
                silent ??= false;

                let member: GuildMember;

                try {
                    member = await _.guild.members.fetch({ user: user.id, force: true });
                } catch {
                    throw "You can only kick users who are in this server.";
                }

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm kicking ${user.tag}`,
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
                await enforcePermissions(_.user, "kick", _.channel!);
                await checkPunishment(response, user, "kick");

                const status = await sendDM(_, user, silent, {
                    embeds: [
                        {
                            title: `You were __kicked__ from **${_.guild.name}**`,
                            color: await getColor(_.guild),
                            fields: reason ? [{ name: "Reason", value: reason }] : [],
                        },
                    ],
                });

                await member.kick(reason).catch(() => {});

                const id = await trpc.addUserHistory.mutate({
                    guild: _.guild.id,
                    user: user.id,
                    type: "kick",
                    mod: _.user.id,
                    origin: response.message.url,
                    reason,
                });

                await response.editReply({
                    embeds: [
                        {
                            title: `Kicked ${user.tag}`,
                            description: `This is case #${id}. ${status}`,
                            color: Colors.Green,
                            fields: reason ? [{ name: "Reason", value: reason }] : [],
                            footer: { text: user.id },
                        },
                    ],
                    components: [],
                });
            }),
    );
