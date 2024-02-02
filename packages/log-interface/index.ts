import { secrets } from "@daedalus/config";
import type { Router } from "@daedalus/logging";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

const trpc = createTRPCClient<Router>({ links: [httpBatchLink({ url: `http://localhost:${secrets.PORTS.LOG}` })] });

export async function logError(guild: string, context: string, body: string) {
    await trpc.postError.mutate({ guild, context, body });
}
