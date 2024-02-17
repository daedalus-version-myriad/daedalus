import { secrets } from "@daedalus/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import ws from "ws";
import account from "./procedures/account";
import botInterface from "./procedures/bot-interface";
import dashboard from "./procedures/dashboard";
import fileService from "./procedures/file-service";
import guildSettings from "./procedures/guild-settings";
import logviewer from "./procedures/logviewer";
import news from "./procedures/news";
import premium from "./procedures/premium";
import users from "./procedures/users";
import vanityClients from "./procedures/vanity-clients";
import { router } from "./trpc";

const appRouter = router({
    ...account,
    ...botInterface,
    ...dashboard,
    ...fileService,
    ...guildSettings,
    ...logviewer,
    ...news,
    ...premium,
    ...users,
    ...vanityClients,
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({ router: appRouter });
server.listen(secrets.PORTS.API);

console.log(`Server listening on localhost:${secrets.PORTS.API}`);

const wss = new ws.Server({ port: secrets.PORTS.WS });
const handler = applyWSSHandler({ wss, router: appRouter });

wss.on("connection", (ws) => {
    console.log(`WS connection opened (current: ${wss.clients.size})`);
    ws.once("close", () => console.log(`WS connection closed (current: ${wss.clients.size})`));
});

console.log(`WS server listening on localhost:${secrets.PORTS.WS}`);

process.on("SIGTERM", () => {
    handler.broadcastReconnectNotification();
    wss.close();
});
