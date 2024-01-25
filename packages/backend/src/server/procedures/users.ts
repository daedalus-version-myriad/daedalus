import { secrets } from "@daedalus/config";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { bot } from "../../bot/index.ts";
import { db } from "../../db/db.ts";
import { tables } from "../../db/index.ts";
import { proc } from "../trpc.ts";

export default {
    userGet: proc.input(z.string()).query(async ({ input: id }) => {
        const user = await bot.users.fetch(id).catch(() => null);
        if (!user) return null;

        return {
            id,
            name: user.displayName,
            image: user.displayAvatarURL({ forceStatic: true, size: 64 }),
            admin:
                id === secrets.OWNER ||
                (
                    await db
                        .select({ count: sql<number>`COUNT(*)` })
                        .from(tables.admins)
                        .where(eq(tables.admins.id, id))
                )[0].count > 0,
        };
    }),
    userGuilds: proc.input(z.string()).query(async ({ input: id }) => {}),
} as const;
