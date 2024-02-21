import { Client, Events, Message, type PartialMessage } from "discord.js";
import { trpc } from "../api/index.js";
import { isWrongClient } from "../bot-utils/index.js";

export const ticketsHook = (client: Client) =>
    client
        .on(Events.MessageCreate, async (message) => {
            const uuid = await getUUID(message);
            if (!uuid) return;

            await trpc.postTicketMessage.mutate({
                uuid,
                id: message.id,
                author: message.author.id,
                content: message.content,
                attachments: [...message.attachments.toJSON(), ...message.stickers.toJSON()].map((x) => ({ name: x.name, url: x.url })),
            });
        })
        .on(Events.MessageUpdate, async (before, after) => {
            if (before.content === after.content) return;
            if (!after.guild || (await isWrongClient(after.client, after.guild))) return;
            await trpc.editTicketMessage.mutate({ id: after.id, content: after.content ?? "" });
        })
        .on(Events.MessageDelete, async (message) => {
            if (!message.guild || (await isWrongClient(message.client, message.guild))) return;
            await trpc.deleteTicketMessages.mutate([message.id]);
        })
        .on(Events.MessageBulkDelete, async (messages) => {
            const message = messages.first()!;
            if (!message.guild || (await isWrongClient(message.client, message.guild))) return;
            await trpc.deleteTicketMessages.mutate([...messages.keys()]);
        });

async function getUUID(message: Message | PartialMessage) {
    return message.guild && !(await isWrongClient(message.client, message.guild)) && message.author && !message.author.bot
        ? (await trpc.getTicket.query(message.channel.id))?.uuid ?? null
        : null;
}
