import { secrets } from "@daedalus/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.ts";
import { tables } from "../db/index.ts";
import { publicProcedure, router } from "./trpc.ts";

const appRouter = router({
    userList: publicProcedure.query(async () => {
        const users = await db.select().from(tables.users);
        return users;
    }),
    userById: publicProcedure.input(z.string()).query(async (opts) => {
        const { input } = opts;
        const user = (await db.select().from(tables.users).where(eq(tables.users.id, input))).at(0);
        return user;
    }),
    userCreate: publicProcedure.input(z.object({ name: z.string() })).query(async (opts) => {
        const { input } = opts;
        const user = await db.insert(tables.users).values({ id: `${Math.random()}`, name: input.name });
    }),
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({ router: appRouter });
server.listen(secrets.API_PORT);

console.log(`Server listening on localhost:${secrets.API_PORT}`);
