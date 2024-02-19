import { trpc } from "@daedalus/api";
import { willAutokick } from "@daedalus/autokick";
import { fetchAndSendCustom, isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { Client, Events, IntentsBitField } from "discord.js";

process.on("uncaughtException", console.error);

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.GuildMembers,
            sweepers: { guildMembers: { filter: () => () => true, interval: 3600 } },
            allowedMentions: { parse: [] },
        }),
    postprocess: (client) =>
        client.on(Events.GuildMemberAdd, async (member) => {
            if (member.user.bot) return;

            if (await isWrongClient(client, member.guild)) return;
            if (await isModuleDisabled(member.guild, "welcome")) return;
            if (await willAutokick(member)) return;

            const settings = await trpc.getWelcomeConfig.query(member.guild.id);
            if (!settings) return;

            await fetchAndSendCustom(
                member.guild,
                settings.channel,
                "Welcome",
                "welcome",
                settings.parsed,
                `The welcome message for ${member} could not be sent.`,
                async () => ({ member: await member.fetch() }),
                true,
            );
        }),
});
