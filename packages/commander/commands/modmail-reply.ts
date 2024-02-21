import { fetchCaller, type Commands } from "../../bot-utils/index.js";
import { getModmailContactInfo, handleReply } from "../../modmail/index.js";
import { addModmailReplyOptions } from "../lib/modmail.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail reply")
            .description("reply to a modmail thread")
            .stringOption("content", "the content of the reply", { maxLength: 4096 })
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
