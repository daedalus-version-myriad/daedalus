import { fetchCaller, type Commands } from "@daedalus/bot-utils";
import { getModmailContactInfo, handleReply } from "@daedalus/modmail";
import { addModmailReplyOptions } from "../lib/modmail";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail reply")
            .description("reply to a modmail thread")
            .stringOption("content", "the content of the reply")
            .use(addModmailReplyOptions)
            .fn(async ({ _, ...data }) => {
                const reply = await _.deferReply();
                return { _, ...data, reply };
            })
            .fn(getModmailContactInfo(false))
            .fn(fetchCaller)
            .fn(
                async ({ _, caller, member, thread, anon, content, reply, ...filemap }) =>
                    await handleReply(_, caller, member, !!anon, content ?? undefined, filemap),
            ),
    );
