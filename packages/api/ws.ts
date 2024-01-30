import type { AppRouter } from "@daedalus/backend";
import { secrets } from "@daedalus/config";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";

const wsClient = createWSClient({ url: `ws://localhost:${secrets.PORTS.WS}` });

export const wsTRPC = createTRPCClient<AppRouter>({ links: [wsLink({ client: wsClient })] });
