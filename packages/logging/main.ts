import { template } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { secrets } from "@daedalus/config";
import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { Client, IntentsBitField, Partials } from "discord.js";
import { z } from "zod";
import { addEventHandlers } from "./src/events";
import { invokeLog } from "./src/lib";

process.on("uncaughtException", console.error);

const Intents = IntentsBitField.Flags;

const manager = new ClientManager({
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
                Intents.MessageContent |
                Intents.GuildMessageReactions |
                Intents.GuildVoiceStates,
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            sweepers: { messages: { lifetime: 604800, interval: 3600 } },
            allowedMentions: { parse: [] },
        }),
    postprocess: addEventHandlers,
});

const t = initTRPC.create();

const router = t.router({
    postError: t.procedure
        .input(z.object({ guild: z.string(), context: z.string(), body: z.string() }))
        .mutation(async ({ input: { guild: id, context, body } }) => {
            const client = await manager.getBot(id);
            if (!client) return;

            const guild = await client.guilds.fetch(id).catch(() => null);
            if (!guild) return;

            invokeLog("botError", guild, () => template.logerror(context, body));
        }),
});

export type Router = typeof router;

const server = createHTTPServer({ router });
server.listen(secrets.PORTS.LOG);

console.log(`Server listening on localhost:${secrets.PORTS.LOG}`);
