import { trpc } from "@daedalus/api";
import { getColor, getMuteRole } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
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

async function cycle() {
    await Promise.all([runModerationRemovalTasks, runModmailCloseTasks, rollGiveaways].map((fn) => fn().catch(console.error)));
    setTimeout(cycle, 10000);
}

cycle();
