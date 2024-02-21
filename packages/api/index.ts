import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../backend/index.js";

export const trpc = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: `http://localhost:${process.env.API_PORT}` })] });
