import { trpc } from "@daedalus/api";
import { confirm, enforcePermissions, template, type Commands } from "@daedalus/bot-utils";
import { Colors } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("unban")
            .description("unban a user, allowing them to join the server again")
            .userOption("user", "the user to unban", { required: true })
            .stringOption("reason", "the reason for unbanning (audit logged)")
            .fn(async ({ _, user, reason }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm unbanning ${user.tag}`,
                                description: "The user will not be notified.",
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
                await enforcePermissions(_.user, "unban", _.channel!);

                try {
                    await _.guild.bans.remove(user, reason ?? undefined);
                    await trpc.removeModerationRemovalTask.mutate({ guild: _.guild.id, user: user.id, action: "unban" });

                    await response.editReply({
                        embeds: [
                            {
                                title: `Unbanned ${user.tag}`,
                                color: Colors.Green,
                                fields: reason ? [{ name: "Reason", value: reason }] : [],
                            },
                        ],
                        components: [],
                    });
                } catch {
                    await response.editReply(template.error(`${user} is not currently banned.`));
                }
            }),
    );
