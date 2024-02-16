import { trpc } from "@daedalus/api";
import { getColor, getMuteRole } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { secrets } from "@daedalus/config";
import { englishList } from "@daedalus/formatting";
import { draw } from "@daedalus/giveaways";
import { logError } from "@daedalus/log-interface";
import { closeModmailThread } from "@daedalus/modmail";
import { Client, IntentsBitField } from "discord.js";

process.on("uncaughtException", console.error);

const Intents = IntentsBitField.Flags;

const manager = new ClientManager({
    factory: () => new Client({ intents: Intents.Guilds, allowedMentions: { parse: [] } }),
});

async function runModerationRemovalTasks() {
    const tasks = await trpc.getAndClearModerationRemovalTasks.query();

    for (const task of tasks) {
        const client = await manager.getBot(task.guild);
        if (!client) continue;

        const guild = await client.guilds.fetch(task.guild).catch(() => null);
        if (!guild) continue;

        if (task.action === "unmute") {
            const member = await guild.members.fetch({ user: task.user, force: true }).catch(() => null);
            const role = await getMuteRole(guild).catch(() => null);

            if (!role) continue;

            if (member) {
                if (role)
                    await member.roles
                        .remove(role, "mute expired")
                        .catch(() =>
                            logError(
                                guild.id,
                                "Unmuting user",
                                `${member}'s mute expired, but ${role} could not be removed from them. Check the bot's permissions.`,
                            ),
                        );
            } else await trpc.deleteStickyRole.mutate({ guild: guild.id, user: task.user, role: role.id });
        } else {
            await guild.bans
                .remove(task.user, "ban expired")
                .catch(() =>
                    logError(guild.id, "Unbanning user", `<@${task.user}>'s ban expired, but they could not be unbanned. Check the bot's permissions.`),
                );
        }
    }
}

async function runModmailCloseTasks() {
    const tasks = await trpc.getAndClearModmailCloseTasks.query();

    for (const task of tasks) {
        const client = await manager.getBot(task.guild);
        if (!client) continue;

        const guild = await client.guilds.fetch(task.guild).catch(() => null);
        if (!guild) continue;

        const channel = await guild.channels.fetch(task.channel).catch(() => null);
        if (!channel?.isTextBased() || !channel.guild) continue;

        await closeModmailThread(channel, task.author, task.notify, task.message);
    }
}

async function rollGiveaways() {
    const giveaways = await trpc.getGiveawaysToClose.query();

    for (const giveaway of giveaways) {
        if (!giveaway.channel) continue;

        const client = await manager.getBot(giveaway.guild);
        if (!client) continue;

        const guild = await client.guilds.fetch(giveaway.guild).catch(() => null);
        if (!guild) continue;

        const channel = await guild.channels.fetch(giveaway.channel).catch(() => null);
        if (!channel?.isTextBased()) continue;

        const result = await draw(guild, giveaway).catch((error) => {
            console.error(error);
            logError(guild.id, "Rolling Giveaway", "An unexpected error occurred computing the results of your giveaway. Please contact support.");
        });

        if (!result) continue;

        try {
            if (!giveaway.messageId) throw 0;

            const message = await channel.messages.fetch(giveaway.messageId);

            await message.edit({
                components: message.components.map((row) => ({ type: row.type, components: row.toJSON().components.map((x) => ({ ...x, disabled: true })) })),
            });
        } catch {}

        await channel
            .send({
                embeds: [
                    {
                        title: `**Giveaway Results (ID: \`${giveaway.id}\`)**`,
                        description: result.length > 0 ? `Congratulations to ${englishList(result)}!` : "Nobody was eligible!",
                        color: await getColor(guild),
                    },
                ],
            })
            .catch(() =>
                logError(
                    guild.id,
                    "Rolling Giveaway",
                    `Your giveaway's results were computed (${result.length > 0 ? englishList(result) : "nobody was eligble"}) but the notice could not be sent to ${channel}. Check the bot's permissions. Use **/giveaway reroll** to run this again.`,
                ),
            );
    }
}

function formatReminder(reminder: { id: number; origin: string; query: string | null }, color: number) {
    return {
        embeds: [
            {
                title: `Reminder #${reminder.id}`,
                description: `You asked to be reminded [here](${reminder.origin})${reminder.query ? `: ${reminder.query}` : ""}`,
                color,
            },
        ],
    };
}

async function runReminders() {
    const reminders = await trpc.getAndClearPastReminders.query();

    const guildReminders: Record<string, typeof reminders> = {};
    const dmReminders: Record<string, typeof reminders> = {};

    for (const reminder of reminders) {
        if (reminder.guild) (guildReminders[reminder.guild] ??= []).push(reminder);
        else (dmReminders[reminder.client] ??= []).push(reminder);
    }

    for (const [guild, reminders] of Object.entries(guildReminders)) {
        const client = await manager.getBot(guild);
        const color = await getColor(guild);

        if (!client) {
            for (const reminder of reminders) (dmReminders[reminder.client] ??= []).push(reminder);
            continue;
        }

        for (const reminder of reminders)
            try {
                const user = await client.users.fetch(reminder.user);
                await user.send(formatReminder(reminder, color));
            } catch {
                (dmReminders[secrets.DISCORD.CLIENT.ID] ??= []).push(reminder);
            }
    }

    const clients = await manager.getBots();
    const ids = new Set(clients.map((client) => client.user.id));

    const fallbackReminders = new Map(
        Object.entries(dmReminders)
            .filter(([client]) => !ids.has(client))
            .flatMap(([, reminders]) => reminders.map((reminder) => [`${reminder.user}/${reminder.id}`, reminder])),
    );

    for (const client of clients)
        for (const reminder of dmReminders[client.user.id] ?? [])
            try {
                const user = await client.users.fetch(reminder.user);
                await user.send(formatReminder(reminder, 0x009688));
            } catch {
                fallbackReminders.set(`${reminder.user}/${reminder.id}`, reminder);
            }

    for (const client of clients)
        for (const [key, reminder] of fallbackReminders)
            try {
                const user = await client.users.fetch(reminder.user);
                await user.send(formatReminder(reminder, 0x009688));
                fallbackReminders.delete(key);
            } catch {}
}

async function cycle() {
    await Promise.all([runModerationRemovalTasks, runModmailCloseTasks, rollGiveaways, runReminders].map((fn) => fn().catch(console.error)));
    setTimeout(cycle, 10000);
}

cycle();
