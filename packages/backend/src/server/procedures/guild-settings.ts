import { z } from "zod";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { proc } from "../trpc";

export default {
    setSettings: proc
        .input(z.object({ guild: z.string(), dashboardPermission: z.enum(["owner", "admin", "manager"]) }))
        .mutation(async ({ input: { guild, ...data } }) => {
            await db
                .insert(tables.guildSettings)
                .values({ guild, ...data })
                .onDuplicateKeyUpdate({ set: data });
        }),
} as const;
