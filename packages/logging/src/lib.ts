import { trpc } from "@daedalus/api";
import type { Awaitable, Channel, Guild, MessageCreateOptions } from "discord.js";
import { getChannelStack, isAssignedClient } from "../../bot-utils";

type MaybeArray<T> = T | T[];

export async function invokeLog(event: string, context: Channel | Guild, fn: () => Awaitable<MaybeArray<MessageCreateOptions>>) {
    if (!("bans" in context) && context.isDMBased()) return;

    const guild = "bans" in context ? context : context.guild;

    if (!(await isAssignedClient(context.client, guild))) return;

    const location = await trpc.getLogLocation.query({ guild: guild.id, event, channels: "bans" in context ? [] : getChannelStack(context) });
    if (!location) return;

    const target = location.type === "webhook" ? location.value : await context.client.channels.fetch(location.value).catch(() => null);
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
