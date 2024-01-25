import { secrets } from "@daedalus/config";
import { Client, Events, IntentsBitField } from "discord.js";
import { inArray } from "drizzle-orm";
import { db } from "../db/db.ts";
import { tables } from "../db/index.ts";

const bot = new Client({
    intents: IntentsBitField.Flags.Guilds | IntentsBitField.Flags.GuildMembers,
    sweepers: { users: { interval: 3600, filter: () => () => true } },
});

const promise = new Promise((r) => bot.on(Events.ClientReady, r));
await bot.login(secrets.DISCORD.TOKEN);
await promise;

export { bot };

const cache = new Map<string, Client>();

setInterval(async () => {
    const entries = await db
        .select()
        .from(tables.tokens)
        .where(inArray(tables.tokens.guild, [...cache.keys()]));

    for (const { guild, token } of entries)
        if (cache.get(guild)?.token !== token) {
            cache.get(guild)?.destroy();
            cache.delete(guild);
        }
}, 86400000);
