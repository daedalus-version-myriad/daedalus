import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { secrets } from "../../../config/index.js";
import account from "./procedures/account.js";
import botInterface from "./procedures/bot-interface.js";
import dashboard from "./procedures/dashboard.js";
import fileService from "./procedures/file-service.js";
import guildSettings from "./procedures/guild-settings.js";
import logviewer from "./procedures/logviewer.js";
import news from "./procedures/news.js";
import premium from "./procedures/premium.js";
import users from "./procedures/users.js";
import vanityClients from "./procedures/vanity-clients.js";
import { router } from "./trpc.js";

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
