import { fetchCaller, getColor, template, type Commands } from "../../bot-utils/index.js";
import { formatCustomMessageString } from "../../custom-messages/index.js";
import { getModmailContactInfo, handleReply } from "../../modmail/index.js";
import { ButtonInteraction, ButtonStyle, Colors, ComponentType, escapeMarkdown } from "discord.js";
import { addModmailSnippetOption, addModmailSnippetSendOption, loadSnippet } from "../lib/modmail.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail snippet send")
            .description("send a snippet (you will be able to inspect and confirm before sending)")
            .use(addModmailSnippetOption)
            .use(addModmailSnippetSendOption)
            .fn(getModmailContactInfo(false))
            .fn(fetchCaller)
            .fn(loadSnippet)
            .fn(async ({ _, caller, anon, snippet, member }) => {
                const content = await formatCustomMessageString(snippet.parsed, { guild: _.guild!, member }).catch((error) => {
                    throw `Error formatting snippet message:\n\`\`\`\n${error}\n\`\`\``;
                });

                const message = await _.reply({
                    embeds: [
                        {
                            title: `Confirm sending snippet "${escapeMarkdown(snippet.name)}"?`,
                            description: content,
                            color: await getColor(_.guild!),
                            footer: { text: "You have 5 minutes to confirm." },
                        },
                    ],
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                { type: ComponentType.Button, style: ButtonStyle.Success, customId: "confirm", label: "Confirm" },
                                { type: ComponentType.Button, style: ButtonStyle.Danger, customId: "cancel", label: "Cancel" },
                            ],
                        },
                    ],
                });

                let response: ButtonInteraction;

                try {
                    response = await message.awaitMessageComponent({
                        componentType: ComponentType.Button,
                        filter: (x) => x.user.id === _.user.id,
                        time: 300000,
                    });

                    if (response.customId === "cancel")
                        return void (await response.update({
                            embeds: [{ title: "Canceled", description: "This message was canceled.", color: Colors.Red }],
                            components: [],
                        }));
                } catch {
                    return void (await _.editReply({
                        embeds: [
                            {
                                title: "Timed Out",
                                description: "You did not respond in time. Please call this command again to try again.",
                                color: Colors.Red,
                            },
                        ],
                        components: [],
                    }));
                }

                await response.deferUpdate();

                try {
                    await response.editReply(await handleReply(_, caller, member, !!anon, content, {}));
                } catch (error) {
                    await response.editReply(template.error(`${error}`));
                }
            }),
    );
