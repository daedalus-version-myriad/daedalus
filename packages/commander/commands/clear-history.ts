import { trpc } from "@daedalus/api";
import { confirm, enforcePermissions, template, type Commands } from "@daedalus/bot-utils";
import { Colors } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("clear-history")
            .description("clear a user's history")
            .userOption("user", "the user to clear", { required: true })
            .fn(async ({ _, user }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                const count = await trpc.countHistoryEntries.query({ guild: _.guild.id, user: user.id });
                if (count === 0) throw "This user's history is clean.";

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm clearing ${user.tag}'s history`,
                                description: `${count} ${count === 1 ? "entry" : "entries"} will be cleared from ${user}'s history.`,
                                color: Colors.DarkVividPink,
                            },
                        ],
                    },
                    300000,
                );

                if (!response) return;
                await enforcePermissions(_.user, "clear-history", _.channel!);

                const deleted = await trpc.clearHistory.mutate({ guild: _.guild.id, user: user.id });
                await response.update(template.success(`Cleared ${deleted} ${deleted === 1 ? "entry" : "entries"} from ${user}'s history.`));
            }),
    );
