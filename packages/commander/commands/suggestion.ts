import { trpc } from "@daedalus/api";
import { defer, template, type Commands } from "@daedalus/bot-utils";
import { Colors, Message } from "discord.js";

export const statuses = {
    implement: { name: "Implemented", color: Colors.Blue },
    approve: { name: "Approved", color: Colors.Green },
    consider: { name: "Considered", color: Colors.Yellow },
    deny: { name: "Denied", color: Colors.Red },
} as const;

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("suggestion update")
            .description("update a suggestion's status")
            .stringOption("status", "the status of the suggestion", {
                required: true,
                choices: Object.fromEntries(Object.entries(statuses).map(([x, y]) => [x, y.name])) as Record<keyof typeof statuses, string>,
            })
            .numberOption("id", "the ID of the suggestion to update", { required: true, minimum: 1 })
            .stringOption("explanation", "an explanation to provide for the status update", { maxLength: 1024 })
            .booleanOption("dm", "if true, DM the suggestion author informing them of the update")
            .booleanOption("anon", "if true, your identity will be hidden in the suggestion embed")
            .fn(defer(true))
            .fn(async ({ _, status, id, explanation, dm, anon }) => {
                const suggestion = await trpc.getSuggestionById.query({ guild: _.guild!.id, id });
                if (!suggestion) throw `No suggestion with ID \`${id}\`.`;

                let message: Message;

                try {
                    const channel = await _.guild!.channels.fetch(suggestion.channel);
                    if (!channel?.isTextBased()) throw 0;

                    message = await channel.messages.fetch(suggestion.message);
                } catch {
                    throw "The suggestion post cannot be found; it may have been deleted.";
                }

                const { name, color } = statuses[status];

                const embed = message.embeds[0].toJSON();

                if (!embed.fields?.length) embed.fields = [{ name: "", value: "" }];
                embed.fields[0] = { name: `**${name}**${anon ? "" : ` by ${_.user.tag}`}`, value: explanation || "_ _" };
                embed.color = color;

                await message.edit({ embeds: [embed] });

                let failed = false;

                if (dm) {
                    const member = await _.guild!.members.fetch({ user: suggestion.user, force: true }).catch(() => {});

                    if (!member) failed = true;
                    else
                        await member
                            .send({
                                embeds: [
                                    {
                                        title: `Suggestion #${id} ${name}`,
                                        description: `Your suggestion was ${name.toLowerCase()}${anon ? "" : ` by ${_.user}`}:\n\n${embed.description}`,
                                        color,
                                        fields: explanation ? [{ name: "Explanation", value: explanation }] : [],
                                        url: message.url,
                                    },
                                ],
                            })
                            .catch(() => (failed = true));
                }

                return template.success(
                    `Suggestion #${id} was ${name.toLowerCase()}${dm ? (failed ? " but the author could not be DM'd" : " and the author was DM'd") : ""}.`,
                );
            }),
    );
