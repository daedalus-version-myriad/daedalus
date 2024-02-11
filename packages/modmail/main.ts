import { trpc } from "@daedalus/api";
import { getColor, isModuleDisabled, template } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { ButtonStyle, Client, ComponentType, Events, IntentsBitField, MessageType, Partials, type Guild, type Message } from "discord.js";
import { handleTargetSelection } from "./lib.ts";
const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.DirectMessages | Intents.GuildMessages | Intents.MessageContent | Intents.GuildMembers,
            partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
            sweepers: { messages: { lifetime: 60, interval: 60 } },
        }),
    postprocess: (client) =>
        client.on(Events.MessageCreate, async (message) => {
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
        }),
});

async function maybeLogInternalMessage(message: Message) {
    await trpc.maybeLogInternalMessage.mutate({
        channel: message.channel.id,
        id: message.id,
        author: message.author.id,
        content: message.content,
        attachments: [...message.attachments.values(), ...message.stickers.values()].map((x) => ({ name: x.name, url: x.url })),
    });
}

async function resolveDefault(message: Message) {}

async function resolveVanity(message: Message, guild: Guild) {
    const thread = await trpc.getLastModmailThread.query({ client: message.client.user.id, user: message.author.id });
    if (thread === null) return await handleTargetSelection(message, guild);

    const targets = await trpc.getModmailTargets.query(guild.id);

    if (targets.length === 1 && targets[0].id === thread.targetId) {
        await message.reply({
            embeds: [
                {
                    title: "Server Selection",
                    description: `Are you sure that you want to send this message to **${guild.name}**?`,
                    color: await getColor(guild),
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        { type: ComponentType.Button, style: ButtonStyle.Success, customId: `::modmail/confirm-single-target/${guild.id}`, label: "Yes" },
                        { type: ComponentType.Button, style: ButtonStyle.Danger, customId: `::cancel`, label: "Cancel" },
                    ],
                },
            ],
        });
    }
}
