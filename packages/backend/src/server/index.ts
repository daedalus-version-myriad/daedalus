import { secrets } from "@daedalus/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import guildSettings from "./procedures/guild-settings";
import news from "./procedures/news";
import users from "./procedures/users";
import vanityClients from "./procedures/vanity-clients";
import { router } from "./trpc";

const appRouter = router({ ...guildSettings, ...users, ...news, ...vanityClients });

export type AppRouter = typeof appRouter;

const server = createHTTPServer({ router: appRouter });
server.listen(secrets.PORTS.API);

console.log(`Server listening on localhost:${secrets.PORTS.API}`);
