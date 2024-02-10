import { trpc } from "@daedalus/api";
import { isModuleDisabled, obtainLimit } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { formatCustomMessageString } from "@daedalus/custom-messages";
import { logError } from "@daedalus/log-interface";
import { Client, IntentsBitField } from "discord.js";

const Intents = IntentsBitField.Flags;

const manager = new ClientManager({ factory: () => new Client({ intents: Intents.Guilds | Intents.GuildMembers }) });

async function run() {
    for (const [guildId, channels] of await trpc.getAllStatsChannels.query()) {
        if (await isModuleDisabled(guildId, "stats-channels")) continue;

        const client = await manager.getBot(guildId);
        if (!client) continue;

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) continue;

        for (const { channel: id, parsed } of channels.slice(0, (await obtainLimit(guildId, "statsChannelsCountLimit")) as number)) {
            const channel = await guild.channels.fetch(id).catch(() => null);
            if (!channel) continue;

            try {
                const name = await formatCustomMessageString(parsed, { guild });
                if (channel.name !== name) await channel.edit({ name });
            } catch (error) {
                await logError(
                    guildId,
                    "Updating Stats Channel",
                    `An error occurred updating ${channel}. Check the bot's permissions and ensure your channel name format is valid. Here are some details about the error:\n\`\`\`\n${error}\n\`\`\``,
                );
            }
        }
    }
}

setTimeout(
    () => {
        run();
        setInterval(run, 300000);
    },
    300000 - (Date.now() % 300000),
);
