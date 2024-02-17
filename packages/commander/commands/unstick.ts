import { trpc } from "@daedalus/api";
import { template, type Commands } from "@daedalus/bot-utils";
import { updateStick } from "@daedalus/sticky-messages";
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
                await updateStick(_.channel as GuildTextBasedChannel);
                return template.success("Removed this channel's sticky message.");
            }),
    );
