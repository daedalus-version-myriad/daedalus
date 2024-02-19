import { trpc } from "@daedalus/api";
import { confirm, enforcePermissions, template, timeinfo, type Commands } from "@daedalus/bot-utils";
import { Colors } from "discord.js";
import { historyActionStrings } from "../lib/moderation";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("delete-history")
            .description("delete a user history entry by ID")
            .numberOption("id", "the ID of the entry to delete", { minimum: 1, required: true })
            .fn(async ({ _, id }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                const entry = await trpc.getHistoryEntry.query({ guild: _.guild.id, id });
                if (!entry) throw `There is no history entry with ID #${id}.`;

                const context = `${historyActionStrings[entry.type].toLowerCase()} #${id} against <@${entry.user}> by <@${entry.mod}> on ${timeinfo(
                    new Date(entry.time),
                )}${entry.origin ? ` [here](${entry.origin})` : ""}${entry.reason ? `\n\n**Reason:** ${entry.reason}` : ""}`;

                const response = await confirm(
                    _,
                    {
                        embeds: [
                            {
                                title: `Confirm deleting history entry #${id}`,
                                description: `Confirm deleting ${context}`,
                                color: Colors.DarkVividPink,
                            },
                        ],
                    },
                    300000,
                );

                if (!response) return;
                await enforcePermissions(_.user, "delete-history", _.channel!);

                await trpc.deleteHistoryEntry.mutate({ guild: _.guild.id, id: entry.id });
                await response.update(template.success(`Deleted ${context}.`));
            }),
    );
