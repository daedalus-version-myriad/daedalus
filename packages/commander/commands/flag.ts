import type { Commands } from "@daedalus/bot-utils";
import { parseMessageURL } from "@daedalus/global-utils";
import { report } from "../lib/reports";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("flag")
            .description("flag a message for moderators")
            .stringOption("url", "the URL of the message", { required: true })
            .fn(async ({ _, url }) => {
                const [gid, cid, mid] = parseMessageURL(url);
                if (gid !== _.guild!.id) throw "That link points to a message in a different server.";

                const channel = await _.guild!.channels.fetch(cid);
                if (!channel?.isTextBased()) throw "Could not find the channel in which the message to which that message link points to is.";

                const message = await channel.messages.fetch(mid).catch(() => {});
                if (!message) throw "Could not find that message.";

                return await report(_, message);
            }),
    );
