import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient, sendCustomMessage } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { formatDuration } from "@daedalus/global-utils";
import { Client, Events, IntentsBitField } from "discord.js";
import { willAutokick } from "./lib";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () => new Client({ intents: Intents.Guilds | Intents.GuildMembers, sweepers: { guildMembers: { filter: () => () => true, interval: 3600 } } }),
    postprocess: (client) =>
        client.on(Events.GuildMemberAdd, async (member) => {
            if (await isWrongClient(client, member.guild)) return;
            if (await isModuleDisabled(member.guild, "autokick")) return;

            const config = await trpc.getAutokickConfig.query(member.guild.id);
            if (!(await willAutokick(member, config))) return;

            if (config.sendMessage)
                try {
                    const channel = await member.createDM();

                    await sendCustomMessage(channel, config.parsed, "Autokick", `An error occurred trying to send an autokick message to ${member}`, {
                        member,
                    });
                } catch {}

            await member.kick(`autokick: minimum account age is ${formatDuration(config.minimumAge)}`);
        }),
});
