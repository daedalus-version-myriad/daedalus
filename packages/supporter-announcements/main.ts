import { trpc } from "@daedalus/api";
import { fetchAndSendCustom, isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { Client, Events, IntentsBitField } from "discord.js";

process.on("uncaughtException", console.error);

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () => new Client({ intents: Intents.Guilds | Intents.GuildMembers, allowedMentions: { parse: [] } }),
    postprocess: (client) => {
        (async () => {
            const guilds = await client.guilds.fetch();
            for (const { id } of guilds.values()) client.guilds.cache.get(id)?.members.fetch();
        })();

        client.on(Events.GuildMemberUpdate, async (before, after) => {
            if (after.user.bot) return;

            if (await isWrongClient(client, after.guild)) return;
            if (await isModuleDisabled(after.guild, "supporter-announcements")) return;

            if (Date.now() - (after.joinedTimestamp ?? 0) < 5000) return; // don't re-announce sticky roles being re-applied

            const entries = await trpc.getSupporterAnnouncementsConfig.query(after.guild.id);
            if (entries.length === 0) return;

            for (const item of entries) {
                if (!item.channel) continue;

                if (item.useBoosts) {
                    if (before.premiumSince || !after.premiumSince) continue;
                } else if (!item.role || before.roles.cache.has(item.role) || !after.roles.cache.has(item.role)) continue;

                await fetchAndSendCustom(
                    after.guild,
                    item.channel,
                    "Supporter Announcements",
                    "supporter announcement",
                    item.parsed,
                    `The supporter announcement for ${after} ${item.useBoosts ? "boosting the server" : `gaining <@&${item.role}>`} could not be sent.`,
                    () => ({ guild: after.guild, member: after, role: item.role === null ? undefined : after.roles.cache.get(item.role) }),
                    true,
                );
            }
        });
    },
});
