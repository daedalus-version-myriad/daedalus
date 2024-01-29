import type { AccountSettings } from "@daedalus/types";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { tables } from "../../db";
import { db } from "../../db/db";
import { snowflake } from "../schemas";
import { proc } from "../trpc";

export default {
    getAccountSettings: proc.input(z.string()).query(async ({ input: id }): Promise<AccountSettings> => {
        return (
            (
                await db
                    .select({
                        notifyPremiumOwnedServers: tables.accountSettings.notifyPremiumOwnedServers,
                        notifyPremiumManagedServers: tables.accountSettings.notifyPremiumManagedServers,
                        suppressAdminBroadcasts: tables.accountSettings.suppressAdminBroadcasts,
                    })
                    .from(tables.accountSettings)
                    .where(eq(tables.accountSettings.user, id))
            ).at(0) ?? {
                notifyPremiumOwnedServers: true,
                notifyPremiumManagedServers: false,
                suppressAdminBroadcasts: false,
            }
        );
    }),
    setAccountSettings: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                notifyPremiumOwnedServers: z.boolean(),
                notifyPremiumManagedServers: z.boolean(),
                suppressAdminBroadcasts: z.boolean(),
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
