import { trpc } from "@daedalus/api";
import { secrets } from "@daedalus/config";
import { Events, type Client } from "discord.js";

export class ClientManager {
    private factory: (token: string) => Promise<Client<true>>;
    private cache = new Map<string, Promise<Client<true>>>();
    private bot: Promise<Client<true>> | undefined;

    constructor(factory: (token: string) => Promise<Client<true>>, sweep: number = 86400000) {
        this.factory = factory;

        if (sweep > 0)
            setInterval(async () => {
                for (const { guild, token } of await trpc.vanityClientList.query([...this.cache.keys()])) {
                    const client = await this.cache.get(guild);
                    if (!client) continue;

                    if (client.token !== token) {
                        client.destroy();
                        this.cache.delete(guild);
                    }
                }
            }, sweep);
    }

    async getBotFromToken(guildId?: string, token?: string | null) {
        if (!guildId || !token) return await (this.bot ??= this.factory(secrets.DISCORD.TOKEN));

        const client = await this.cache.get(guildId);
        if (client?.token === token) return client;

        const promise = this.factory(token);
        this.cache.set(guildId, promise);
        return await promise;
    }

    async getBot(guildId?: string) {
        return await this.getBotFromToken(guildId, guildId && (await trpc.vanityClientGet.query(guildId)));
    }

    async getBots() {
        const entries = await trpc.vanityClientList.query();

        const clients = [await this.getBot()];

        for (const { guild, token } of entries)
            try {
                clients.push(await this.getBotFromToken(guild, token));
            } catch {}

        return clients;
    }

    async getBotsWithGuilds(): Promise<Record<string, Client<true>>> {
        const entries = await trpc.vanityClientList.query();

        return {
            default: await this.getBot(),
            ...Object.fromEntries(
                await Promise.all(entries.map(async ({ guild, token }): Promise<[string, Client<true>]> => [guild, await this.getBotFromToken(guild, token)])),
            ),
        };
    }
}

export function loginAndReady(client: Client, token: string, timeout: number = 10000) {
    const promise = new Promise<Client<true>>((res, rej) => {
        const timer = setTimeout(() => rej(), timeout);

        client.on(Events.ClientReady, (bot) => {
            res(bot);
            clearTimeout(timer);
        });
    });

    client.login(token);

    return promise;
}
