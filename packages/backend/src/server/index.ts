import { secrets } from "@daedalus/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import news from "./procedures/news.ts";
import users from "./procedures/users.ts";
import { router } from "./trpc.ts";

const appRouter = router({ ...users, ...news });

export type AppRouter = typeof appRouter;

const server = createHTTPServer({ router: appRouter });
server.listen(secrets.PORTS.API);

console.log(`Server listening on localhost:${secrets.PORTS.API}`);
