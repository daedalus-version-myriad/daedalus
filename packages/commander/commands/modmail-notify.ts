import { trpc } from "@daedalus/api";
import { template, type Commands } from "@daedalus/bot-utils";
import { getModmailContactInfo } from "@daedalus/modmail";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail notify")
            .description("set ping notifications for this thread")
            .stringOption("mode", "the notification setting", {
                required: true,
                choices: { off: "off (no notifications)", once: "once (next message)", all: "subscribe (all messages)" },
            })
            .fn(getModmailContactInfo(true))
            .fn(async ({ _, mode }) => {
                await trpc.setModmailNotify.mutate({ channel: _.channel!.id, user: _.user.id, delete: mode === "off", once: mode === "once" });

                return template.success(
                    {
                        off: "You will no longer receive notification pings for this thread.",
                        once: "You will be pinged for the next incoming message in this thread.",
                        all: "You will be pinged for all subsequent incoming messages in this thread.",
                    }[mode],
                );
            }),
    );
