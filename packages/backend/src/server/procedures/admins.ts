import { secrets } from "@daedalus/config";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db.ts";
import { tables } from "../../db/index.ts";
import { proc } from "../trpc.ts";

export default {
    isAdmin: proc.input(z.string()).query(async ({ input }) => {
        return (
            input === secrets.OWNER ||
            (
                await db
                    .select({ count: sql<number>`COUNT(*)` })
                    .from(tables.admins)
                    .where(eq(tables.admins.id, input))
            )[0].count > 0
        );
    }),
} as const;
