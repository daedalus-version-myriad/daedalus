import { secrets } from "@daedalus/config";
import { PremiumTier, premiumBenefits, type PremiumBenefits } from "@daedalus/data";
import { Collection, GuildMember, PermissionFlagsBits, escapeMarkdown, type User } from "discord.js";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getPaymentLinks, getPortalSessions } from "../../../stripe";
import { clients, setPresence } from "../../bot";
import { tables } from "../../db";
import { db } from "../../db/db";
import { snowflake } from "../schemas";
import { proc } from "../trpc";
import { NO_PERMISSION, hasPermission, isOwner } from "./guild-settings";
import { isAdmin } from "./users";
import { clientUpdateEmitter } from "./vanity-clients";

export async function getLimit(guild: string, key: keyof PremiumBenefits) {
    const [entry] = await db.select({ value: tables.limitOverrides[key] }).from(tables.limitOverrides).where(eq(tables.limitOverrides.guild, guild));
    if (entry && entry.value !== null) return entry.value;

    const [premiumEntry] = await db
        .select({ premium: tables.guildPremiumSettings.hasPremium })
        .from(tables.guildPremiumSettings)
        .where(eq(tables.guildPremiumSettings.guild, guild));

    return premiumBenefits[premiumEntry?.premium ? PremiumTier.PREMIUM : PremiumTier.FREE][key];
}

async function recalculateGuild(guild: string) {
    const activeKeys = await db
        .select({ key: tables.premiumKeys.key })
        .from(tables.premiumKeyBindings)
        .leftJoin(tables.premiumKeys, eq(tables.premiumKeyBindings.key, tables.premiumKeys.key))
        .where(and(eq(tables.premiumKeyBindings.guild, guild), eq(tables.premiumKeys.disabled, false)));

    const hasPremium = activeKeys.some(({ key }) => key?.startsWith("pk_"));
    const hasCustom = activeKeys.some(({ key }) => key?.startsWith("ck_"));

    const old = (
        await db
            .select({ hasPremium: tables.guildPremiumSettings.hasPremium, hasCustom: tables.guildPremiumSettings.hasCustom })
            .from(tables.guildPremiumSettings)
            .where(eq(tables.guildPremiumSettings.guild, guild))
    ).at(0) ?? { hasPremium: false, hasCustom: false };

    if (old.hasPremium === hasPremium && old.hasCustom === hasCustom) return;

    const client = await clients.getBot(guild);
    await db.insert(tables.guildPremiumSettings).values({ guild, hasPremium, hasCustom }).onDuplicateKeyUpdate({ set: { hasPremium, hasCustom } });

    if (!client) return;

    (async () => {
        try {
            const obj = await client.guilds.fetch(guild).catch(() => null);
            if (!obj) return;

            const users: User[] = [];

            const owner = await obj.fetchOwner().catch(() => null);

            if (
                owner &&
                ((
                    await db
                        .select({ notify: tables.accountSettings.notifyPremiumOwnedServers })
                        .from(tables.accountSettings)
                        .where(eq(tables.accountSettings.user, owner.id))
                ).at(0)?.notify ??
                    true)
            )
                users.push(owner.user);

            const dashboardPermission =
                (
                    await db
                        .select({ dashboardPermission: tables.guildSettings.dashboardPermission })
                        .from(tables.guildSettings)
                        .where(eq(tables.guildSettings.guild, guild))
                ).at(0)?.dashboardPermission ?? "manager";

            const members =
                dashboardPermission === "owner"
                    ? new Collection<string, GuildMember>()
                    : (await obj.members.fetch()).filter(
                          (member) =>
                              member.id !== owner?.id &&
                              member.permissions.has(dashboardPermission === "admin" ? PermissionFlagsBits.Administrator : PermissionFlagsBits.ManageGuild),
                      );

            const toNotify = await db
                .select({ id: tables.accountSettings.user })
                .from(tables.accountSettings)
                .where(and(eq(tables.accountSettings.notifyPremiumManagedServers, true), inArray(tables.accountSettings.user, [...members.keys()])));

            for (const { id } of toNotify) users.push(members.get(id)!.user);

            for (const user of users)
                await user
                    .send({
                        embeds: [
                            {
                                title: "Premium Status Changed",
                                description: `Hello, ${user}! The premium status of **${escapeMarkdown(obj.name)}** has changed. Please double-check your settings as some changes may affect functionality.\n\nTo stop receiving these notifications, you can disable them at ${secrets.DOMAIN}/account.`,
                                color: 0x009688,
                                fields: [
                                    hasPremium && !old.hasPremium
                                        ? [
                                              {
                                                  name: "Premium has been activated",
                                                  value: "The increased module limits may cause some previously disabled prompts/actions to start operating again if this server previously had premium.",
                                              },
                                          ]
                                        : [],
                                    !hasPremium && old.hasPremium
                                        ? [
                                              {
                                                  name: "Premium has been deactivated.",
                                                  value: "Some items may be disabled due to module limits and multi-target modmail and ticket prompts are no longer available.",
                                              },
                                          ]
                                        : [],
                                    hasCustom && !old.hasCustom
                                        ? [
                                              {
                                                  name: "The custom client feature has been activated.",
                                                  value: `You may now set up a custom client at ${secrets.DOMAIN}/manage/${guild}/premium.`,
                                              },
                                          ]
                                        : [],
                                    !hasCustom && old.hasCustom
                                        ? [
                                              {
                                                  name: "The custom client feature has been deactivated.",
                                                  value: "Your server will be returned to the base Daedalus client. If you upgrade again, you will need to set up your token again.",
                                              },
                                          ]
                                        : [],
                                ].flat(),
                            },
                        ],
                    })
                    .catch(() => null);
        } finally {
            if (old.hasCustom && !hasCustom) {
                await db.delete(tables.tokens).where(eq(tables.tokens.guild, guild));
                clientUpdateEmitter.emit("update", { guild, token: null });
            }
        }
    })();
}

async function recalculateKeysForUser(user: string) {
    let enable: string[] = [];
    let disable: string[] = [];

    if (await isAdmin(user)) {
        enable = (
            await db
                .select({ key: tables.premiumKeys.key })
                .from(tables.premiumKeys)
                .where(and(eq(tables.premiumKeys.user, user), eq(tables.premiumKeys.disabled, true)))
        ).map(({ key }) => key);
    } else {
        let premiumKeyTotal = 0;
        let customKeyTotal = 0;

        const sessions = await getPortalSessions(user, false);

        for (const session of sessions)
            for (const subscription of session.subscriptions)
                if (subscription.type === "premium") premiumKeyTotal += subscription.quantity;
                else customKeyTotal += subscription.quantity;

        await db.transaction(async (tx) => {
            const keys = await tx
                .select({ key: tables.premiumKeys.key, disabled: tables.premiumKeys.disabled })
                .from(tables.premiumKeys)
                .where(eq(tables.premiumKeys.user, user))
                .orderBy(asc(tables.premiumKeys.time));

            for (const { key, disabled } of keys)
                if ((key.startsWith("pk_") ? premiumKeyTotal-- : customKeyTotal--) > 0) {
                    if (disabled) enable.push(key);
                } else {
                    if (!disabled) disable.push(key);
                }

            if (enable.length > 0) await tx.update(tables.premiumKeys).set({ disabled: false }).where(inArray(tables.premiumKeys.key, enable));
            if (disable.length > 0) await tx.update(tables.premiumKeys).set({ disabled: true }).where(inArray(tables.premiumKeys.key, disable));
        });
    }

    if (enable.length === 0 && disable.length === 0) return;

    const guildsToUpdate = await db
        .select({ guild: tables.premiumKeyBindings.guild })
        .from(tables.premiumKeys)
        .leftJoin(tables.premiumKeyBindings, eq(tables.premiumKeys.key, tables.premiumKeyBindings.key))
        .where(inArray(tables.premiumKeys.key, [...enable, ...disable]));

    for (const { guild } of guildsToUpdate) if (guild) await recalculateGuild(guild).catch(() => null);
}

export default {
    premiumPageDataGet: proc.input(z.string()).query(async ({ input: id }) => {
        const keys = await db
            .select({ key: tables.premiumKeys.key, disabled: tables.premiumKeys.disabled })
            .from(tables.premiumKeys)
            .where(eq(tables.premiumKeys.user, id));

        return {
            sessions: await getPortalSessions(id),
            links: await getPaymentLinks(id),
            keys,
            activations: Object.fromEntries(
                keys.length > 0
                    ? (
                          await db
                              .select({ key: tables.premiumKeyBindings.key, guild: tables.premiumKeyBindings.guild })
                              .from(tables.premiumKeyBindings)
                              .where(
                                  inArray(
                                      tables.premiumKeyBindings.key,
                                      keys.map(({ key }) => key),
                                  ),
                              )
                      ).map<[string, string]>(({ key, guild }) => [key, guild])
                    : [],
            ),
        };
    }),
    pairCustomer: proc.input(z.object({ discord: snowflake, stripe: z.string().max(32) })).mutation(async ({ input: { discord, stripe } }) => {
        await db.insert(tables.customers).values({ discord, stripe });
    }),
    getCustomer: proc.input(z.string().max(32)).query(async ({ input: stripe }) => {
        return (await db.select({ discord: tables.customers.discord }).from(tables.customers).where(eq(tables.customers.stripe, stripe))).at(0)?.discord;
    }),
    provisionKey: proc.input(z.object({ owner: snowflake, type: z.enum(["premium", "custom"]) })).mutation(async ({ input: { owner, type } }) => {
        const key = `${type === "premium" ? "pk" : "ck"}_${new Array(20)
            .fill(0)
            .map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)])
            .join("")}`;

        await db.insert(tables.premiumKeys).values({ user: owner, key });
        await recalculateKeysForUser(owner);

        return key;
    }),
    deleteKey: proc.input(z.object({ owner: snowflake, key: z.string().max(32) })).mutation(async ({ input: { owner, key } }) => {
        const { rowsAffected } = await db.delete(tables.premiumKeys).where(and(eq(tables.premiumKeys.user, owner), eq(tables.premiumKeys.key, key)));
        if (rowsAffected === 0) return;

        const [entry] = await db
            .select({ guild: tables.premiumKeyBindings.guild })
            .from(tables.premiumKeyBindings)
            .where(eq(tables.premiumKeyBindings.key, key));

        if (!entry) return;

        await db.delete(tables.premiumKeyBindings).where(eq(tables.premiumKeyBindings.key, key));
        await recalculateGuild(entry.guild);
    }),
    bindKey: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake, key: z.string().max(32) })).mutation(async ({ input: { id, guild, key } }) => {
        if (!(await hasPermission(id, guild))) return NO_PERMISSION;

        const [entry] = await db.select().from(tables.premiumKeys).where(eq(tables.premiumKeys.key, key));
        if (!entry) return "That key does not exist. Please make sure you copy-pasted / typed it correctly.";
        if (entry.disabled) return "That key exists, but the owner does not have enough premium subscriptions, so it is currently disabled.";

        try {
            await db.insert(tables.premiumKeyBindings).values({ guild, key });
        } catch {
            return "That key could not be added; it may already be in use.";
        }

        await recalculateGuild(guild);
    }),
    unbindKey: proc.input(z.object({ id: snowflake.nullable(), guild: snowflake, key: z.string().max(32) })).mutation(async ({ input: { id, guild, key } }) => {
        if (!(await hasPermission(id, guild))) return NO_PERMISSION;
        await db.delete(tables.premiumKeyBindings).where(and(eq(tables.premiumKeyBindings.guild, guild), eq(tables.premiumKeyBindings.key, key)));
        await recalculateGuild(guild);
    }),
    recalculateKeysForUser: proc.input(snowflake).mutation(async ({ input: user }) => {
        await recalculateKeysForUser(user);
    }),
    bindToken: proc
        .input(z.object({ id: snowflake.nullable(), guild: snowflake, token: z.string().nullable() }))
        .mutation(async ({ input: { id, guild, token } }) => {
            if (!(await isOwner(id, guild))) return NO_PERMISSION;

            if (token) {
                if (
                    (
                        await db
                            .select({ count: sql<number>`COUNT(*)` })
                            .from(tables.tokens)
                            .where(eq(tables.tokens.token, token))
                    )[0].count > 0
                )
                    return "That client is already in use by another guild.";

                const client = await clients.getBotFromToken(guild, token).catch(() => null);
                if (!client) return "That token doesn't seem to be valid. Please make sure you've provided a valid token.";

                const obj = await client.guilds.fetch(guild).catch(() => {});
                if (!obj) return "That token was valid, but the guild could not be fetched. Please make sure the bot is in the server.";

                await db.insert(tables.tokens).values({ guild, token }).onDuplicateKeyUpdate({ set: { token } });
            } else {
                await db.delete(tables.tokens).where(eq(tables.tokens.guild, guild));
            }

            clientUpdateEmitter.emit("update", { guild, token });
        }),
    setStatus: proc
        .input(
            z.object({
                id: snowflake.nullable(),
                guild: snowflake,
                status: z.enum(["online", "idle", "dnd", "invisible"]),
                activityType: z.enum(["none", "playing", "listening-to", "watching", "competing-in"]),
                activity: z.string().max(64, "Status activity text must be at most 64 characters."),
            }),
        )
        .mutation(async ({ input: { id, guild, ...data } }) => {
            if (!(await isOwner(id, guild))) return NO_PERMISSION;

            await db
                .insert(tables.guildPremiumSettings)
                .values({ guild, ...data })
                .onDuplicateKeyUpdate({ set: data });

            const client = await clients.getBot(guild);
            if (!client) return;

            await setPresence(client, guild);
        }),
    getLimit: proc
        .input(
            z.object({ id: snowflake.nullable(), guild: snowflake, key: z.string() }) as z.ZodType<{
                id: string | null;
                guild: string;
                key: keyof PremiumBenefits;
            }>,
        )
        .query(async ({ input: { id, guild, key } }) => {
            if (!(await hasPermission(id, guild))) throw NO_PERMISSION;

            return await getLimit(guild, key);
        }),
} as const;
