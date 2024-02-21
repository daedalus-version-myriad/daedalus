import { fetchCaller, type Commands } from "../../bot-utils/index.js";
import { getModmailContactInfo, startModal } from "../../modmail/index.js";
import { addModmailReplyOptions } from "../lib/modmail.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail reply-modal")
            .description("reply to a modmail thread, entering content in a modal (allows multi-line)")
            .use(addModmailReplyOptions)
            .fn(getModmailContactInfo(false))
            .fn(fetchCaller)
            .fn(async ({ _, caller, member, thread, anon, ...filemap }) => {
                await startModal(_, caller, member, !!anon, undefined, filemap);
            }),
    );
