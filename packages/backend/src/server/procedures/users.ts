import { PermissionFlagsBits } from "discord.js";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { secrets } from "../../../../config/index.js";
import type { DashboardGuild } from "../../../../types/index.js";
import { bot, clients } from "../../bot/index.js";
import { db } from "../../db/db.js";
import { tables } from "../../db/index.js";
import { snowflake } from "../schemas.js";
import { proc } from "../trpc.js";

export async function isAdmin(id: string) {
    return (
        id === secrets.OWNER ||
        (
            await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(tables.admins)
                .where(eq(tables.admins.id, id))
        )[0].count > 0
    );
}

function key(server: { hasBot: boolean; owner: boolean; permissions: string; features: string[] }) {
    return [
        server.hasBot,
        server.owner,
        (BigInt(server.permissions) & PermissionFlagsBits.Administrator) > 0n,
        (BigInt(server.permissions) & PermissionFlagsBits.ManageGuild) > 0n,
        server.features.includes("COMMUNITY"),
    ]
        .map<number>((x) => (x ? 0 : 1))
        .reduce((x, y) => x * 2 + y);
}

export default {
    isAdmin: proc.input(snowflake).query(async ({ input: id }) => {
        return await isAdmin(id);
    }),
    userGet: proc.input(z.object({ id: snowflake, guild: snowflake.optional() })).query(async ({ input: { id, guild: guildId } }) => {
        const client = (await clients.getBot(guildId).catch(() => null)) ?? (await bot);

        const user = await client.users.fetch(id).catch(() => null);
        if (!user) return null;

        let owner = id === secrets.OWNER;

        if (!owner && guildId) {
            const guild = await client.guilds.fetch(guildId).catch(() => null);
            if (guild?.ownerId === id) owner = true;
        }

        return {
            id,
            name: user.displayName,
            image: user.displayAvatarURL({ forceStatic: true, size: 64 }),
            admin: await isAdmin(id),
            owner,
        };
    }),
    userGuilds: proc.input(z.object({ id: snowflake, token: z.string() })).query(async ({ input: { id, token } }) => {
        const request = await fetch(`${secrets.DISCORD.API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${token}` } });
        const guilds = ((await request.json()) as { id: string; name: string; icon?: string; owner: boolean; permissions: string; features: string[] }[]).map(
            (guild) => ({
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                owner: guild.owner,
                permissions: guild.permissions,
                hasBot: false,
                features: guild.features.filter((x) => ["COMMUNITY"].includes(x)),
            }),
        );

        const ids = guilds.map((guild) => guild.id);

        const thresholds = new Map<string, "owner" | "admin" | "manager">();

        for (const entry of ids.length > 0
            ? await db
                  .select({ guild: tables.guildSettings.guild, threshold: tables.guildSettings.dashboardPermission })
                  .from(tables.guildSettings)
                  .where(inArray(tables.guildSettings.guild, [...ids]))
            : []) {
            thresholds.set(entry.guild, entry.threshold);
        }

        const filtered = (await isAdmin(id))
            ? guilds
            : guilds.filter(({ id, owner, permissions }) => {
                  const threshold = thresholds.get(id) ?? "manager";

                  if (threshold === "owner") return owner;
                  if (threshold === "admin") return !!(BigInt(permissions) & PermissionFlagsBits.Administrator);
                  if (threshold === "manager") return !!(BigInt(permissions) & PermissionFlagsBits.ManageGuild);
              });

        const bots = await clients.getBotsWithGuilds();
        const guildsWithBot = new Set<string>();

        for (const [bot, guild] of bots) {
            if (guild) {
                if (await bot.guilds.fetch(guild).catch(() => null)) guildsWithBot.add(guild);
            } else for (const { id } of bot.guilds.cache.values()) guildsWithBot.add(id);
        }

        for (const guild of filtered) guild.hasBot = guildsWithBot.has(guild.id);

        return filtered.sort((a, b) => key(a) - key(b) || a.name.localeCompare(b.name));
    }),
    userGuild: proc
        .input(z.object({ id: snowflake, guild: snowflake }))
        .query(async ({ input: { id, guild: guildId } }): Promise<{ error: string } | DashboardGuild> => {
            const client = await clients.getBot(guildId);
            const guild = await client?.guilds.fetch({ guild: guildId, force: true })?.catch(() => null);
            if (!guild) return { error: `Could not fetch the server with ID ${guildId}.` };

            if (!(await isAdmin(id))) {
                const member = await guild.members.fetch(id).catch(() => null);
                if (!member) return { error: `You are not a member of ${guild.name}.` };

                const threshold =
                    (
                        await db
                            .select({ threshold: tables.guildSettings.dashboardPermission })
                            .from(tables.guildSettings)
                            .where(eq(tables.guildSettings.guild, guildId))
                    ).at(0)?.threshold ?? "manager";

                if (
                    threshold === "owner"
                        ? id !== guild.ownerId
                        : threshold === "admin"
                          ? !member.permissions.has(PermissionFlagsBits.Administrator)
                          : threshold === "manager"
                            ? !member.permissions.has(PermissionFlagsBits.ManageGuild)
                            : true
                )
                    return { error: `You do not have permission to manage ${guild.name}.` };
            }

            const me = await guild.members.fetchMe();

            return {
                id: guild.id,
                name: guild.name,
                owner: id === secrets.OWNER || id === guild.ownerId,
                roles: guild.roles.cache
                    .sort((x, y) => -x.comparePositionTo(y))
                    .map((role) => ({
                        id: role.id,
                        name: role.name,
                        color: role.color,
                        everyone: role.id === guild.roles.everyone.id,
                        managed: role.managed,
                        higher: role.comparePositionTo(me.roles.highest) >= 0,
                        position: role.position,
                    })),
                channels: guild.channels.cache
                    .filter((channel) => !channel.isThread())
                    .map((channel) => ({
                        id: channel.id,
                        type: channel.type,
                        position: "position" in channel ? channel.position : 0,
                        name: channel.name,
                        parent: channel.parentId,
                        readonly: channel.isThread()
                            ? !channel.parent?.permissionsFor(me).has(PermissionFlagsBits.SendMessagesInThreads)
                            : !channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages),
                    })),
                emojis: guild.emojis.cache.map((emoji) => ({ id: emoji.id, name: emoji.name ?? "[unnamed emoji]", url: emoji.imageURL({ size: 64 }) })),
                stickers: guild.stickers.cache.map((sticker) => ({ id: sticker.id, name: sticker.name, url: sticker.url })),
            };
        }),
} as const;
