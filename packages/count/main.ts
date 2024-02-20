import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { Client, Events, Message, type PartialMessage } from "discord.js";

export const countHook = (client: Client<true>) =>
    client
        .on(Events.MessageCreate, async (message) => {
            if (!message.guild) return;
            if (message.author.id === client.user.id) return;
            if (await isWrongClient(client, message.guild)) return;
            if (await isModuleDisabled(message.guild, "count")) return;

            const channel = await trpc.getCountChannel.query({ guild: message.guild.id, channel: message.channel.id });
            if (!channel) return;

            if (!channel.allowDoubleCounting && (await trpc.getCountLast.query(channel.id)) === message.author.id) return void (await dismiss(message));
            if (message.content !== `${channel.next}` || message.attachments.size > 0 || message.stickers.size > 0) return void (await dismiss(message));

            last.set(message.channel.id, message.id);
            await trpc.updateCount.mutate({ id: channel.id, user: message.author.id });
        })
        .on(Events.MessageUpdate, handleChange)
        .on(Events.MessageDelete, handleChange)
        .on(Events.MessageBulkDelete, async (messages) => await handleChange(messages.first()!));

const last = new Map<string, string>();

async function handleChange(before: Message | PartialMessage, after?: Message | PartialMessage) {
    if (!before.guild) return;

    if (before.content === after?.content) return;
    if (before.id !== last.get(before.channel.id)) return;

    if (await isWrongClient(before.client, before.guild)) return;
    if (await isModuleDisabled(before.guild, "count")) return;

    const channel = await trpc.getCountChannel.query({ guild: before.guild.id, channel: before.channel.id });
    if (!channel) return;

    if (`${channel.next - channel.interval}` !== before.content) return;

    if (after) await dismiss(after);
    await before.channel.send(`${before.author}: ${before.content}`);
}

async function dismiss(message: Message | PartialMessage) {
    await message.delete().catch(() => message.react(":x:").catch(() => null));
}
