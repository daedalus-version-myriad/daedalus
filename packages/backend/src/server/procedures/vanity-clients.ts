import { observable } from "@trpc/server/observable";
import { and, eq, inArray } from "drizzle-orm";
import { EventEmitter } from "events";
import { z } from "zod";
import { tables } from "../../db";
import { db } from "../../db/db";
import { snowflake } from "../schemas";
import { proc } from "../trpc";

type ClientConfig = { guild: string; token: string | null };

export const clientUpdateEmitter = new EventEmitter();

export default {
    vanityClientList: proc.input(snowflake.array().optional()).query(async ({ input: guildIds }) => {
        if (guildIds?.length === 0) return <{ guild: string; token: string }[]>[];

        const eqCondition = eq(tables.guildPremiumSettings.hasCustom, true);

        return await db
            .select({ guild: tables.tokens.guild, token: tables.tokens.token })
            .from(tables.tokens)
            .leftJoin(tables.guildPremiumSettings, eq(tables.tokens.guild, tables.guildPremiumSettings.guild))
            .where(guildIds ? and(eqCondition, inArray(tables.tokens.guild, guildIds)) : eqCondition);
    }),
    vanityClientGet: proc.input(snowflake).query(async ({ input: guildId }) => {
        const [entry] = await db
            .select({ hasCustom: tables.guildPremiumSettings.hasCustom })
            .from(tables.guildPremiumSettings)
            .where(eq(tables.guildPremiumSettings.guild, guildId));

        if (!entry?.hasCustom) return null;

        return (await db.select({ token: tables.tokens.token }).from(tables.tokens).where(eq(tables.tokens.guild, guildId))).at(0)?.token;
    }),
    vanityClientHook: proc.subscription(() =>
        observable<ClientConfig>((emit) => {
            const hook = (data: ClientConfig) => emit.next(data);
            clientUpdateEmitter.on("update", hook);
            return () => clientUpdateEmitter.off("update", hook);
        }),
    ),
    vanityClientByToken: proc.input(z.string()).query(async ({ input: token }) => {
        const guild = (await db.select({ guild: tables.tokens.guild }).from(tables.tokens).where(eq(tables.tokens.token, token))).at(0)?.guild;
        if (!guild) return null;

        const [entry] = await db
            .select({})
            .from(tables.guildPremiumSettings)
            .where(and(eq(tables.guildPremiumSettings.guild, guild), eq(tables.guildPremiumSettings.hasCustom, true)));

        return entry ? guild : null;
    }),
} as const;
