import { trpc } from "@daedalus/api";
import type { Awaitable, Channel, Client, MessageCreateOptions } from "discord.js";
import { getChannelStack, isAssignedClient } from "../../bot-utils";

type MaybeArray<T> = T | T[];

export async function invokeLog(event: string, client: Client, channel: Channel, fn: () => Awaitable<MaybeArray<MessageCreateOptions>>) {
    if (channel.isDMBased()) return;
    if (!(await isAssignedClient(client, channel.guild))) return;

    const location = await trpc.getLogLocation.query({ guild: channel.guildId, event, channels: getChannelStack(channel) });
    if (!location) return;

    const target = location.type === "webhook" ? location.value : await client.channels.fetch(location.value).catch(() => null);
    if (!target) return;
    if (typeof target !== "string" && !target.isTextBased()) return;

    const data = await fn();

    for (const entry of Array.isArray(data) ? data : [data])
        try {
            if (typeof target === "string")
                await fetch(target, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
            else await target.send(entry);
        } catch (error) {
            console.error(error);
        }
}
