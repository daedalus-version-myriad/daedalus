import { trpc } from "../../api/index.js";
import { template, type Commands } from "../../bot-utils/index.js";
import { updateStick } from "../../sticky-messages/index.js";
import type { GuildTextBasedChannel } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("unstick")
            .description("remove the channel's sticky message")
            .fn(async ({ _ }) => {
                const entry = await trpc.getStickyMessage.query(_.channel!.id);
                if (!entry) throw "This channel does not have a sticky message.";

                await _.deferReply({ ephemeral: true });
                await trpc.setStickyMessage.mutate({ guild: _.guild!.id, channel: _.channel!.id, content: "", seconds: 4 });
                await updateStick(_.channel as GuildTextBasedChannel);
                return template.success("Removed this channel's sticky message.");
            }),
    );
