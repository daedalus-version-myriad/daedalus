import { ClientManager } from "@daedalus/clients";
import { Client } from "discord.js";

new ClientManager({
    factory: () => new Client({ intents: 0 }),
    postprocess: (client) => client.channels.fetch("927153548922322976").then((ch) => void (ch?.isTextBased() && ch.send("Hello, World!"))),
});
