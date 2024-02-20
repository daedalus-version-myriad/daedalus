import { template } from "@daedalus/bot-utils";
import type { ClientManager } from "@daedalus/clients";
import { secrets } from "@daedalus/config";
import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import type { Client } from "discord.js";
import { z } from "zod";
import { addEventHandlers } from "./src/events";
import { invokeLog } from "./src/lib";

let manager: ClientManager;

export const loggingHook = (client: Client, x: ClientManager) => {
    manager = x;
    addEventHandlers(client);
};

const t = initTRPC.create();

const router = t.router({
    postError: t.procedure
        .input(z.object({ guild: z.string(), context: z.string(), body: z.string() }))
        .mutation(async ({ input: { guild: id, context, body } }) => {
            if (!manager) return;

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
