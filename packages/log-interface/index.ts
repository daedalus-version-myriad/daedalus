import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { secrets } from "../config/index.js";
import type { Router } from "../logging/index.js";

const trpc = createTRPCClient<Router>({ links: [httpBatchLink({ url: `http://localhost:${secrets.PORTS.LOG}` })] });

export async function logError(guild: string, context: string, body: string) {
    await trpc.postError.mutate({ guild, context, body }).catch(console.error);
}
