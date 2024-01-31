import { ClientManager } from "@daedalus/clients";
import { Client, IntentsBitField, Partials } from "discord.js";
import { addEventHandlers } from "./src/events";

process.on("uncaughtException", console.error);

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents:
                Intents.Guilds |
                Intents.GuildMembers |
                Intents.GuildEmojisAndStickers |
                Intents.GuildModeration |
                Intents.GuildScheduledEvents |
                Intents.GuildInvites |
                Intents.GuildMessages |
                Intents.MessageContent,
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
        }),
    postprocess: addEventHandlers,
});
