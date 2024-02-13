import { fetchCaller, type Commands } from "@daedalus/bot-utils";
import { formatCustomMessageString } from "@daedalus/custom-messages";
import { getModmailContactInfo, startModal } from "@daedalus/modmail";
import { addModmailSnippetOption, addModmailSnippetSendOption, loadSnippet } from "../lib/modmail";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail snippet use-as-template")
            .description("use a snippet as a template and edit the content before sending")
            .use(addModmailSnippetOption)
            .use(addModmailSnippetSendOption)
            .fn(getModmailContactInfo(false))
            .fn(fetchCaller)
            .fn(loadSnippet)
            .fn(
                async ({ _, caller, member, anon, snippet }) =>
                    await startModal(
                        _,
                        caller,
                        member,
                        !!anon,
                        await formatCustomMessageString(snippet.parsed, { guild: _.guild, member }).catch((error) => {
                            throw `Error formatting snippet message:\n\`\`\`\n${error}\n\`\`\``;
                        }),
                        {},
                    ),
            ),
    );
