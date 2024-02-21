import { trpc } from "../../api/index.js";
import { defer, getColor, mdash, template, type Commands } from "../../bot-utils/index.js";
import { ButtonStyle, ComponentType, type ButtonComponentData } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("suggest")
            .description("submit a suggestion to the server's suggestion channel")
            .stringOption("suggestion", "the suggestion to submit", { required: true, maxLength: 1024 })
            .fn(defer(true))
            .fn(async ({ _, suggestion }) => {
                const config = await trpc.getSuggestionsConfig.query(_.guild!.id);
                if (!config.channel) throw "This server has not set up suggestions.";

                const channel = await _.guild!.channels.fetch(config.channel).catch(() => {});
                if (!channel?.isTextBased()) throw "This server has not configured the suggestion channel or it is missing.";

                const caller = await _.guild!.members.fetch(_.user);
                const id = await trpc.getNextSuggestionId.mutate(_.guild!.id);

                const message = await channel
                    .send({
                        embeds: [
                            {
                                title: `Suggestion #${id}`,
                                description: suggestion,
                                color: await getColor(_.guild!),
                                author: config.anon ? undefined : { name: _.user.tag, icon_url: caller.displayAvatarURL({ size: 256 }) },
                                footer: {
                                    text: config.anon
                                        ? `Author hidden ${mdash} moderators can use the button below to view the user.`
                                        : `Suggested by ${_.user.tag} (${_.user.id})`,
                                },
                            },
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        style: ButtonStyle.Success,
                                        customId: "::suggestions/vote:yes",
                                        emoji: "⬆️",
                                        label: "0",
                                    },
                                    {
                                        type: ComponentType.Button,
                                        style: ButtonStyle.Danger,
                                        customId: "::suggestions/vote:no",
                                        emoji: "⬇️",
                                        label: "0",
                                    },
                                    ...(config.anon
                                        ? [
                                              {
                                                  type: ComponentType.Button,
                                                  style: ButtonStyle.Secondary,
                                                  customId: "::suggestions/view",
                                                  label: "View Author",
                                              } satisfies ButtonComponentData,
                                          ]
                                        : []),
                                ],
                            },
                        ],
                    })
                    .catch(() => {
                        throw `Your suggestion could not be posted. There may be issues with the permissions.`;
                    });

                await trpc.postSuggestion.mutate({ guild: _.guild!.id, id, channel: message.channel.id, message: message.id, user: _.user.id });

                return template.success(`Your suggestion has been posted to ${message.url}!`);
            }),
    );
