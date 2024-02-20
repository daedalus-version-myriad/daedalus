import { trpc } from "@daedalus/api";
import { willAutokick } from "@daedalus/autokick";
import { fetchAndSendCustom, isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { Client, Events } from "discord.js";

export const welcomeHook = (client: Client) =>
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
    });
