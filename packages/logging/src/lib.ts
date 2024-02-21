import type { Awaitable, Channel, Guild, InviteGuild, MessageCreateOptions } from "discord.js";
import { trpc } from "../../api/index.js";
import { getChannelStack, isModuleDisabled, isWrongClient } from "../../bot-utils/index.js";

type MaybeArray<T> = T | T[];

export async function invokeLog(event: string, context: Channel | Guild | InviteGuild, fn: () => Awaitable<MaybeArray<MessageCreateOptions>>) {
    if ("isDMBased" in context && context.isDMBased()) return;

    const guild = "guild" in context ? context.guild : context;

    if (await isWrongClient(context.client, guild.id)) return;
    if (await isModuleDisabled(guild.id, "logging")) return;

    const location = await trpc.getLogLocation.query({ guild: guild.id, event, channels: "guild" in context ? getChannelStack(context) : [] });
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
