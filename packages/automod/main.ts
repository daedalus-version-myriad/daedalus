import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { Client, Events, IntentsBitField, type Message, type PartialMessage } from "discord.js";
import { match, skip, type Rule } from "./lib";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
            sweepers: { messages: { lifetime: 600, interval: 3600 } },
        }),
    postprocess: (client) => client.on(Events.MessageCreate, check).on(Events.MessageUpdate, async (_, message) => await check(message)),
});

async function check(message: Message | PartialMessage) {
    if (!message.guild) return;
    if (message.author?.id === message.client.user.id) return;
    // TODO: if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    if (await isWrongClient(message.client, message.guild)) return;
    if (await isModuleDisabled(message.guild, "automod")) return;

    if (message.webhookId && (await message.fetchWebhook().catch(() => null))?.isChannelFollower()) return;

    const config = await trpc.getAutomodConfig.query(message.guild.id);

    const actionDurations: Partial<Record<Rule["additionalAction"], number>> = {};
    const reports = new Map<string, { rule: Rule; report: string; notified: boolean }[]>();
    const notifs: string[] = [];

    let willDelete = false,
        willNotify = false,
        caught = false;

    const multiDeleteTargets: Message[] = [];

    let fetched: Message;
    if (!message.partial) fetched = message;

    for (const rule of config.rules) {
        if (skip(message, rule, config)) continue;
        fetched ??= await message.fetch();

        const result = await match(rule, fetched, multiDeleteTargets);
        if (!result) continue;

        const [notif, report] = result;
    }
}
