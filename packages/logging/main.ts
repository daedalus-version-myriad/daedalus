import { embed, expand } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { AuditLogEvent, Client, Colors, Events, IntentsBitField } from "discord.js";
import { invokeLog } from "./src/lib.ts";
import { audit, channelTypes } from "./src/utils.ts";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () => new Client({ intents: Intents.Guilds | Intents.GuildMembers }),
    postprocess: (client) =>
        client
            .on(Events.ChannelCreate, (channel) => {
                invokeLog("channelCreate", channel, async () => {
                    const user = await audit(channel.guild, AuditLogEvent.ChannelCreate, channel);
                    return embed("Channel Created", `${expand(user, "System")} created ${expand(channel)}`, Colors.Green);
                });
            })
            .on(Events.ChannelDelete, (channel) => {
                if (channel.isDMBased()) return;

                invokeLog("channelDelete", channel, async () => {
                    const user = await audit(channel.guild, AuditLogEvent.ChannelDelete, channel);
                    return embed(
                        "Channel Deleted",
                        `${expand(user, "System")} deleted ${channelTypes[channel.type]} ${channel.name} (\`${channel.id}\`)`,
                        Colors.Red,
                    );
                });
            }),
});
