import type { AppRouter } from "@daedalus/backend";
import { secrets } from "@daedalus/config";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export const trpc = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: `http://localhost:${secrets.PORTS.API}` })] });
