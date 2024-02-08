import { ClientManager } from "@daedalus/clients";
import { Client, Events, IntentsBitField, type Message, type PartialMessage } from "discord.js";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
            sweepers: { messages: { lifetime: 600, interval: 3600 } },
        }),
    postprocess: (client) => client.on(Events.MessageCreate, check).on(Events.MessageUpdate, async (_, message) => await check(message)),
});

async function check(message: Message | PartialMessage) {
    if (!message.guild) return;
}
