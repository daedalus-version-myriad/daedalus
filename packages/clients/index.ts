import { trpc } from "@daedalus/api";
import { wsTRPC } from "@daedalus/api/ws";
import { secrets } from "@daedalus/config";
import { Events, type Client } from "discord.js";

export class ClientManager {
    private factory: (token: string, guild?: string) => Promise<Client<true>>;
    private cache = new Map<string, Promise<Client<true> | null>>();
    private bot: Promise<Client<true>> | undefined;

    constructor({
        factory,
        postprocess,
        sweep = 86400000,
    }: {
        factory: () => Client<false>;
        postprocess?: (client: Client<true>, guild?: string) => unknown;
        sweep?: number;
    }) {
        this.factory = async (token, guild) => {
            const client = await loginAndReady(factory(), token);
            postprocess?.(client, guild);
            return client;
        };

        if (sweep > 0) setInterval(() => this.sweepClients(), sweep);

        const self = this;

        wsTRPC.vanityClientHook.subscribe(undefined, {
            onData(data) {
                self.getBotFromToken(data.guild, data.token);
            },
        });
    }

    async cleanup(guild: string, client: Client) {
        try {
            // TODO: Figure out how to get this to not crash the program
            // await client.destroy();
        } catch {}

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

            return await (this.bot ??= this.factory(secrets.DISCORD.TOKEN));
        }

        const client = await this.cache.get(guildId);
        if (client?.token === token) return client;

        if (client) this.cleanup(guildId, client);

        const promise = this.factory(token, guildId).catch(() => null);
        this.cache.set(guildId, promise);
        return await promise;
    }

    async getDefaultBot() {
        return (await this.getBotFromToken())!;
    }

    async getBot(guildId?: string) {
        return await this.getBotFromToken(guildId, guildId && (await trpc.vanityClientGet.query(guildId)));
    }

    async getBots() {
        const entries = await trpc.vanityClientList.query();

        const clients = [await this.getDefaultBot()];

        for (const { guild, token } of entries) {
            const client = await this.getBotFromToken(guild, token);
            if (client) clients.push(client);
        }

        return clients;
    }
}

export async function loginAndReady(client: Client, token: string, timeout: number = 10000) {
    const promise = new Promise<Client<true>>((res, rej) => {
        const timer = setTimeout(() => rej(), timeout);

        client.on(Events.ClientReady, (bot) => {
            res(bot);
            clearTimeout(timer);
        });
    });

    await client.login(token);

    return await promise;
}
