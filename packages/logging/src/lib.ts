import { parseWebhookURL, type Awaitable, type Channel, type Guild, type InviteGuild, type MessageCreateOptions } from "discord.js";
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

    const array = Array.isArray(data) ? data : [data];

    if (typeof target === "string") {
        const webhookData = parseWebhookURL(target);
        if (!webhookData) return;

        const webhook = await context.client.fetchWebhook(webhookData.id, webhookData.token).catch(() => null);
        if (!webhook) return;

        for (const entry of array)
            try {
                await webhook.send(entry);
            } catch (error) {
                console.error(error);
            }
    } else
        for (const entry of array)
            try {
                await target.send(entry);
            } catch (error) {
                console.error(error);
            }
}
