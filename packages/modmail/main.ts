import { Client, Events, MessageType, type Guild, type Message } from "discord.js";
import { trpc } from "../api/index.js";
import { isModuleDisabled, isWrongClient, template } from "../bot-utils/index.js";
import { modmailGuildSelector, modmailMultiResendConfirmation, modmailReply, modmailResendConfirmation, modmailTargetSelector } from "./lib.js";

export const modmailHook = (client: Client) =>
    client
        .on(Events.MessageCreate, async (message) => {
            if (message.author.id === message.client.user.id) return;
            if (message.type !== MessageType.Default && message.type !== MessageType.Reply) return;
            if (message.guild) return await maybeLogInternalMessage(message);
            if (message.stickers.size > 0) return void (await message.reply(template.error("Unfortunately, stickers cannot be sent through modmail.")));

            const vanity = await trpc.vanityClientByToken.query(message.client.token);

            if (vanity) {
                const guild = await message.client.guilds.fetch(vanity).catch(() => null);
                if (!guild || (await isModuleDisabled(guild, "modmail"))) return;

                await resolveVanity(message, guild);
            } else await resolveDefault(message);
        })
        .on(Events.MessageUpdate, async (before, after) => {
            if (before.content === after.content) return;
            if (!after.guild) return;
            if (await isWrongClient(after.client, after.guild)) return;
            if (await isModuleDisabled(after.guild, "modmail")) return;

            await trpc.recordInternalMessageEdit.mutate({ message: after.id, content: after.content ?? "" });
        })
        .on(Events.MessageDelete, async (message) => {
            if (!message.guild) return;
            if (await isWrongClient(message.client, message.guild)) return;
            if (await isModuleDisabled(message.guild, "modmail")) return;

            await trpc.recordInternalMessageDeletes.mutate([message.id]);
        })
        .on(Events.MessageBulkDelete, async (messages) => {
            const guild = messages.first()!.guild;

            if (!guild) return;
            if (await isWrongClient(guild.client, guild)) return;
            if (await isModuleDisabled(guild, "modmail")) return;

            await trpc.recordInternalMessageDeletes.mutate([...messages.keys()]);
        });

async function maybeLogInternalMessage(message: Message) {
    if (await isWrongClient(message.client, message.guild!)) return;
    if (await isModuleDisabled(message.guild!, "modmail")) return;

    await trpc.maybeLogInternalMessage.mutate({
        channel: message.channel.id,
        id: message.id,
        author: message.author.id,
        content: message.content,
        attachments: [...message.attachments.values(), ...message.stickers.values()].map((x) => ({ name: x.name, url: x.url })),
    });
}

async function resolveDefault(message: Message) {
    const openThreads = (await trpc.getOpenModmailThreads.query({ guild: null, user: message.author.id })).filter(({ guild }) =>
        message.client.guilds.cache.has(guild),
    );

    console.log(
        `Received message from ${message.author.id}; resolving with the global client (${openThreads.length} open thread${openThreads.length === 1 ? "" : "s"})`,
    );

    if (openThreads.length === 0) await modmailReply(message, modmailGuildSelector(message.author));
    else if (openThreads.length === 1)
        await modmailReply(message, modmailResendConfirmation(message.client.guilds.cache.get(openThreads[0].guild)!, openThreads[0].targetId, true));
    else await modmailReply(message, modmailMultiResendConfirmation(message.client, openThreads, true));
}

async function resolveVanity(message: Message, guild: Guild) {
    const openThreads = await trpc.getOpenModmailThreads.query({ guild: guild.id, user: message.author.id });

    console.log(
        `Received message from ${message.author.id}; resolving with vanity client ${message.client.user.id} for guild ${guild.id} (${openThreads.length} open thread${openThreads.length === 1 ? "" : "s"})`,
    );

    if (openThreads.length === 0) await modmailReply(message, modmailTargetSelector(guild, false));
    else if (openThreads.length === 1) await modmailReply(message, modmailResendConfirmation(guild, openThreads[0].targetId, false));
    else await modmailReply(message, modmailMultiResendConfirmation(message.client, openThreads, false));
}
