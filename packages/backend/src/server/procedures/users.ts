import { secrets } from "@daedalus/config";
import { DISCORD_API } from "@daedalus/config/public";
import { PermissionFlagsBits } from "discord.js";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { bot, clients } from "../../bot/index";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { proc } from "../trpc";

async function isAdmin(id: string) {
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
    userGet: proc.input(z.string()).query(async ({ input: id }) => {
        const user = await (await bot).users.fetch(id).catch(() => null);
        if (!user) return null;

        return {
            id,
            name: user.displayName,
            image: user.displayAvatarURL({ forceStatic: true, size: 64 }),
            admin: await isAdmin(id),
        };
    }),
    userGuilds: proc.input(z.object({ id: z.string(), token: z.string() })).query(async ({ input: { id, token } }) => {
        const request = await fetch(`${DISCORD_API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${token}` } });
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

        const bots = await clients.getBots();
        const guildsWithBot = new Set((await Promise.all(bots.map(async (bot) => (await bot.guilds.fetch()).map((guild) => guild.id)))).flat());

        for (const guild of filtered) guild.hasBot = guildsWithBot.has(guild.id);

        return filtered.sort((a, b) => key(a) - key(b) || a.name.localeCompare(b.name));
    }),
} as const;
