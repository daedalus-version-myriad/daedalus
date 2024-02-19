import { trpc } from "@daedalus/api";
import { willAutokick } from "@daedalus/autokick";
import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { Client, Events, IntentsBitField } from "discord.js";

process.on("uncaughtException", console.error);

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () => new Client({ intents: Intents.Guilds | Intents.GuildMembers, allowedMentions: { parse: [] } }),
    postprocess: (client) =>
        client.on(Events.GuildMemberAdd, async (member) => {
            if (await isWrongClient(member.client, member.guild)) return;
            if (await isModuleDisabled(member.guild, "autoroles")) return;
            if (await willAutokick(member)) return;

            const { roles } = await trpc.getAutorolesConfig.query(member.guild.id);
            if (roles.length === 0) return;

            await member.roles.add(roles, "added by autoroles module");
        }),
});
