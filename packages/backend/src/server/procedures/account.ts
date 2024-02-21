import { eq } from "drizzle-orm";
import { z } from "zod";
import type { AccountSettings } from "../../../../types/index.js";
import { db } from "../../db/db.js";
import { tables } from "../../db/index.js";
import { snowflake } from "../schemas.js";
import { proc } from "../trpc.js";

export default {
    getAccountSettings: proc.input(z.string()).query(async ({ input: id }): Promise<AccountSettings> => {
        return (
            (
                await db
                    .select({
                        notifyPremiumOwnedServers: tables.accountSettings.notifyPremiumOwnedServers,
                        notifyPremiumManagedServers: tables.accountSettings.notifyPremiumManagedServers,
                    })
                    .from(tables.accountSettings)
                    .where(eq(tables.accountSettings.user, id))
            ).at(0) ?? {
                notifyPremiumOwnedServers: true,
                notifyPremiumManagedServers: false,
            }
        );
    }),
    setAccountSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                notifyPremiumOwnedServers: z.boolean(),
                notifyPremiumManagedServers: z.boolean(),
            }),
        )
        .mutation(async ({ input: { id, ...data } }) => {
            if (!id) return;

            await db
                .insert(tables.accountSettings)
                .values({ user: id, ...data })
                .onDuplicateKeyUpdate({ set: data });
        }),
} as const;
