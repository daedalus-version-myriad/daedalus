import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { Client, Events, IntentsBitField, type GuildTextBasedChannel } from "discord.js";
import { updateStick } from "./lib";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({ intents: Intents.Guilds | Intents.GuildMessages, sweepers: { messages: { lifetime: 1, interval: 60 } }, allowedMentions: { parse: [] } }),
    postprocess: (client) =>
        client.on(Events.MessageCreate, async (message) => {
            if (!message.guild) return;
            if (message.author.id === message.client.user.id) return;
            if (await isWrongClient(message.client, message.guild)) return;
            if (await isModuleDisabled(message.guild, "sticky-messages")) return;

            await updateStick(message.channel as GuildTextBasedChannel);
        }),
});
