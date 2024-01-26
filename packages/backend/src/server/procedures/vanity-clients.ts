import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { proc } from "../trpc";

export default {
    vanityClientList: proc.input(z.string().array().optional()).query(async ({ input: guildIds }) => {
        const query = db.select({ guild: tables.tokens.guild, token: tables.tokens.token }).from(tables.tokens);
        return await (guildIds
            ? guildIds.length === 0
                ? <{ guild: string; token: string }[]>[]
                : query.where(inArray(tables.tokens.guild, guildIds))
            : query);
    }),
    vanityClientGet: proc.input(z.string()).query(async ({ input: guildId }) => {
        return (await db.select({ token: tables.tokens.token }).from(tables.tokens).where(eq(tables.tokens.guild, guildId))).at(0)?.token;
    }),
} as const;
