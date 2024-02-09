import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { Client, Events, GuildMember, IntentsBitField, Partials, type PartialGuildMember } from "discord.js";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.GuildMembers,
            partials: [Partials.GuildMember],
        }),
    postprocess: (client) =>
        client
            .on(Events.GuildMemberRemove, syncRoles)
            .on(Events.GuildMemberUpdate, async (_, member) => await syncRoles(member))
            .on(Events.GuildMemberAdd, async (member) => {
                if (await isWrongClient(member.client, member.guild)) return;
                if (await isModuleDisabled(member.guild, "sticky-roles")) return;

                let roles = await trpc.getStickyRoles.query({ guild: member.guild.id, user: member.id });
                if (roles.length === 0) return;

                const { roles: exclude } = await trpc.getStickyRolesConfig.query(member.guild.id);

                const me = await member.guild.members.fetchMe();
                roles = roles.filter((x) => !exclude.includes(x) && me.roles.highest.comparePositionTo(x) > 0);

                if (roles.length > 0) await member.roles.add(roles, "re-adding roles to returning member");
            }),
});

async function syncRoles(member: GuildMember | PartialGuildMember) {
    if (await isWrongClient(member.client, member.guild)) return;
    if (await isModuleDisabled(member.guild, "sticky-roles")) return;

    await trpc.setStickyRoles.mutate({
        guild: member.guild.id,
        user: member.id,
        roles: [...member.roles.cache.filter((x) => !x.managed && x.id !== member.guild.roles.everyone.id).keys()],
    });
}
