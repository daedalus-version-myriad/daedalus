import { Client, Events, GuildMember, type PartialGuildMember } from "discord.js";
import { trpc } from "../api/index.js";
import { willAutokick } from "../autokick/index.js";
import { isModuleDisabled, isWrongClient } from "../bot-utils/index.js";

export const stickyAutoRolesHook = (client: Client) =>
    client
        .on(Events.GuildMemberRemove, syncRoles)
        .on(Events.GuildMemberUpdate, async (_, member) => await syncRoles(member))
        .on(Events.GuildMemberAdd, async (member) => {
            if (await isWrongClient(member.client, member.guild)) return;

            const stickyRolesDisabled = await isModuleDisabled(member.guild, "sticky-roles");
            const autoRolesDisabled = await isModuleDisabled(member.guild, "autoroles");

            if (stickyRolesDisabled && autoRolesDisabled) return;
            if (await willAutokick(member)) return;

            let roles: string[] = [];

            if (!stickyRolesDisabled) {
                roles = await trpc.getStickyRoles.query({ guild: member.guild.id, user: member.id });
                const { roles: exclude } = await trpc.getStickyRolesConfig.query(member.guild.id);
                roles = roles.filter((x) => !exclude.includes(x));
            }

            if (!autoRolesDisabled) {
                const { roles: autoroles } = await trpc.getAutorolesConfig.query(member.guild.id);
                roles = [...roles, ...autoroles];
            }

            if (roles.length === 0) return;

            const me = await member.guild.members.fetchMe();
            roles = roles.filter((role) => me.roles.highest.comparePositionTo(role) > 0);

            if (roles.length > 0) await member.roles.add(roles);
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
