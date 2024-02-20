import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import type { ClientManager } from "@daedalus/clients";
import { Client, Events, GuildChannel, MessageType, OAuth2Guild, type Channel } from "discord.js";
import { addXp } from "./utils";

let manager: ClientManager;

const lastMessage = new Map<string, number>();

export const xpHook = (client: Client, x: ClientManager) => {
    manager = x;

    client.on(Events.MessageCreate, async (message) => {
        if (!message.guild) return;
        if (message.author.bot) return;
        if (![MessageType.Default, MessageType.Reply].includes(message.type)) return;

        if (await isWrongClient(client, message.guild)) return;
        if (await isModuleDisabled(message.guild, "xp")) return;

        if (message.channel.isDMBased()) return;
        let channel: Channel | null = message.channel;

        const settings = await trpc.getXpConfig.query(message.guild.id);

        do if (settings.blockedChannels.includes(channel.id)) return;
        while ((channel = channel.parent));

        if (message.member?.roles.cache.hasAny(...settings.blockedRoles)) return;

        const now = Date.now();
        if (lastMessage.has(message.author.id) && now - lastMessage.get(message.author.id)! < 60000) return;
        lastMessage.set(message.author.id, now);

        await addXp(message.channel, message.member!, 1, 0, settings);
    });
};

const tracking = new Map<string, Set<string>>();

async function cycle() {
    if (!manager) return;

    try {
        const clients = await manager.getBots();
        const guilds: OAuth2Guild[] = [];

        for (const client of clients)
            for (const guild of (await client.guilds.fetch()).values()) if (!(await isWrongClient(client, guild.id))) guilds.push(guild);

        const ids = new Set(await trpc.getHasXpEnabled.query(guilds.map((guild) => guild.id)));
        const filtered = guilds.filter((guild) => ids.has(guild.id));

        const configs = Object.fromEntries((await trpc.getAllXpConfigs.query(filtered.map((guild) => guild.id))).map((data) => [data.guild, data]));

        for (const guild of filtered) {
            const settings = configs[guild.id];
            if (!settings) return;

            if (!tracking.has(guild.client.user.id)) tracking.set(guild.client.user.id, new Set());
            const tracker = tracking.get(guild.client.user.id)!;

            const seen = new Set<string>();

            try {
                for (const state of (await guild.fetch()).voiceStates.cache.values()) {
                    if (!state.member) continue;

                    seen.add(state.member.id);

                    if (tracker.has(state.member.id)) {
                        if (!state.channel) continue;

                        let channel: GuildChannel | null = state.channel;
                        do if (settings.blockedChannels.includes(channel.id)) return;
                        while ((channel = channel.parent));

                        if (state.member.roles.cache.hasAny(...settings.blockedRoles)) return;

                        await addXp(state.channel, state.member, 0, 1, settings);
                    } else tracker.add(state.member.id);
                }

                for (const id of tracker) if (!seen.has(id)) tracker.delete(id);
            } catch (error) {
                console.error(error);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

await cycle();
setInterval(cycle, 60000);

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of lastMessage) if (now - value >= 60000) lastMessage.delete(key);
}, 3600000);
