import { trpc } from "@daedalus/api";
import { secrets } from "@daedalus/config";
import { ChannelType, type Channel, type Client, type Guild } from "discord.js";

export async function isAssignedClient(client: Client, guild: Guild | string) {
    const id = typeof guild === "string" ? guild : guild.id;
    const token = await trpc.vanityClientGet.query(id);
    return client.token === (token ?? secrets.DISCORD.TOKEN);
}

export async function getColor(guild: Guild | string) {
    return await trpc.getColor.query(typeof guild === "string" ? guild : guild.id);
}

export function getChannelStack(channel: Channel): string[] {
    if (channel.isDMBased() || channel.type === ChannelType.GuildCategory || !channel.parent) return [channel.id];
    return [channel.id, ...getChannelStack(channel.parent)];
}
