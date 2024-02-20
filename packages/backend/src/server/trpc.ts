import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const proc = publicProcedure.use(async (opts) => {
    const start = Date.now();
    const result = await opts.next();
    const duration = Date.now() - start;
    if (!result.ok) console.log({ path: opts.path, type: opts.type, duration, ok: result.ok });

    return result;
});
