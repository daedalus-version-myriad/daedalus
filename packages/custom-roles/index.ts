import { secrets } from "../config/index.js";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { Router } from "./main.js";
export * from "./lib.js";

const trpc = createTRPCClient<Router>({ links: [httpBatchLink({ url: `http://localhost:${secrets.PORTS.CUSTOM_ROLE_SWEEPER}` })] });

export async function triggerCustomRoleSweep(guild: string) {
    await trpc.update.mutate(guild);
}
