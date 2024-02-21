import { fetchCaller, getColor, type Commands } from "../../bot-utils/index.js";
import { formatCustomMessageString } from "../../custom-messages/index.js";
import { escapeMarkdown } from "discord.js";
import { addModmailSnippetOption, loadSnippet } from "../lib/modmail.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail snippet view")
            .description("view a snippet's content")
            .use(addModmailSnippetOption)
            .fn(fetchCaller)
            .fn(loadSnippet)
            .fn(async ({ _, caller, snippet }) => {
                const content = await formatCustomMessageString(snippet.parsed, { guild: _.guild, member: caller }).catch((error) => {
                    throw `Error formatting snippet message:\n\`\`\`\n${error}\n\`\`\``;
                });

                return {
                    embeds: [
                        {
                            title: `Preview Snippet "${escapeMarkdown(snippet.name)}"`,
                            description: content,
                            color: await getColor(_.guild!),
                            footer: {
                                text: "This message is formatted as though you were the recipient. When sent, names and other values will be replaced with the recipient's data (if applicable).",
                            },
                        },
                    ],
                    ephemeral: true,
                };
            }),
    );
