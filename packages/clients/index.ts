import { Events, type Client } from "discord.js";
import { trpc } from "../api/index.js";
import { secrets } from "../config/index.js";

export class ClientManager {
    private factory: (token: string, guild?: string) => Promise<Client<true>>;
    private cache = new Map<string, Promise<Client<true> | null>>();
    private bot: Promise<Client<true>> | undefined;

    constructor({
        factory,
        postprocess,
        sweep = 86400000,
    }: {
        factory: (sequence: number) => Client<boolean> | null;
        postprocess?: (client: Client<true>, guild?: string) => unknown;
        sweep?: number;
    }) {
        this.factory = async (token, guild) => {
            for (let sequence = 0; ; sequence++) {
                const output = factory(sequence);
                if (output === null) throw new Error(`factory @ sequence=${sequence} returned null, indicating that there are no more outputs`);
                console.log(`[CM] Producing client for guild ${guild} with token ${token.slice(0, 5)}...${token.slice(-5)} (sequence=${sequence})`);
                const client = await loginAndReady(output, token).catch((error) => {
                    console.error(`[CM] Error creating client for ${guild}:`, error);
                });
                if (!client) continue;
                postprocess?.(client, guild);
                console.log(`[CM] ${client.user.tag} is online.`);
                return client;
            }
        };

        if (sweep > 0) setInterval(() => this.sweepClients(), sweep);

        this.getDefaultBot();

        trpc.vanityClientList.query().then(async (entries) => {
            for (const { guild, token } of entries) await this.getBotFromToken(guild, token);
        });
    }

    async cleanup(guild: string, client: Client) {
        try {
            await client.destroy();
        } catch {
            console.error(`Failed to obliterate client for guild ${guild}: ${client.user?.tag}`);
        }

        this.cache.delete(guild);
    }

    async sweepClients() {
        for (const { guild, token } of await trpc.vanityClientList.query([...this.cache.keys()])) {
            const client = await this.cache.get(guild)?.catch(() => null);
            if (!client) continue;

            if (client.token !== token) await this.cleanup(guild, client);
        }
    }

    async getBotFromToken(guildId?: string, token?: string | null) {
        if (!guildId || !token) {
            if (guildId) {
                const client = await this.cache.get(guildId);
                if (client) this.cleanup(guildId, client);
            }

            return await (this.bot ??= this.factory(secrets.DISCORD.TOKEN).catch((error) => {
                throw error ?? "failed to mint bot with default token and no real error thrown!";
            }));
        }

        if (this.cache.has(guildId)) {
            const client = await this.cache.get(guildId);
            if (client?.token === token) return client;
            if (client) this.cleanup(guildId, client);
        }

        const promise = this.factory(token, guildId).catch(() => null);
        this.cache.set(guildId, promise);
        return await promise;
    }

    async getDefaultBot() {
        return (await this.getBotFromToken())!;
    }

    async getBot(guildId?: string): Promise<Client<true> | null> {
        return await this.getBotFromToken(guildId, guildId && (await trpc.vanityClientGet.query(guildId))).catch((error) => {
            throw error ?? "failed to get bot from token";
        });
    }

    async getBots() {
        const entries = await trpc.vanityClientList.query().catch(() => {
            throw "failed to get vanity client list from trpc";
        });

        const clients = [
            await this.getDefaultBot().catch((error) => {
                throw error ?? "failed to get default bot";
            }),
        ];

        for (const { guild, token } of entries) {
            const client = await this.getBotFromToken(guild, token).catch((error) => {
                throw error ?? "failed to get bot from token";
            });
            if (client) clients.push(client);
        }

        return clients;
    }

    async getBotsWithGuilds() {
        const entries = await trpc.vanityClientList.query();

        const clients: [Client, string | null][] = [[await this.getDefaultBot(), null]];

        for (const { guild, token } of entries) {
            const client = await this.getBotFromToken(guild, token);
            if (client) clients.push([client, guild]);
        }

        return clients;
    }
}

export async function loginAndReady(client: Client, token: string, timeout: number = 60000) {
    const promise = new Promise<Client<true>>((res, rej) => {
        const timer = setTimeout(() => rej("timed out!"), timeout);

        client.on(Events.ClientReady, (bot) => {
            res(bot);
            clearTimeout(timer);
        });
    });

    await client.login(token).catch((error) => {
        throw error ?? `failed to log in with token ${token.slice(0, 5)}...${token.slice(-5)}`;
    });

    return await promise;
}
