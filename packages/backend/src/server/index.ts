import { secrets } from "@daedalus/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import admins from "./procedures/admins.ts";
import news from "./procedures/news.ts";
import { router } from "./trpc.ts";

const appRouter = router({ ...admins, ...news });

export type AppRouter = typeof appRouter;

const server = createHTTPServer({ router: appRouter });
server.listen(secrets.PORTS.API);

console.log(`Server listening on localhost:${secrets.PORTS.API}`);
