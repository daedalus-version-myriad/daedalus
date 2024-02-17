import { clients } from "../../bot/index.ts";
import { proc } from "../trpc.ts";

export default {
    checkStatus: proc.query(() => true),
    getGuildCount: proc.query(async () => {
        let ids = new Set<string>();

        for (const [client, guild] of await clients.getBotsWithGuilds()) {
            if (guild) {
                const obj = await client.guilds.fetch(guild).catch(() => null);
                if (obj) ids.add(obj.id);
            } else {
                for (const [, { id }] of await client.guilds.fetch()) {
                    ids.add(id);
                }
            }
        }

        return ids.size;
    }),
} as const;
