import { trpc } from "@daedalus/api";
import type { GuildCustomRolesSettings } from "@daedalus/types";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";

export async function isSupporter(member: GuildMember, config?: GuildCustomRolesSettings) {
    config ??= await trpc.getCustomRolesConfig.query(member.guild.id);
    return (config.allowBoosters && !!member.premiumSince) || member.roles.cache.hasAny(...config.roles);
}

export async function getCustomRoleData(
    cmd: ChatInputCommandInteraction,
): Promise<{ member: GuildMember; config: GuildCustomRolesSettings; role: string | null }> {
    const member = await cmd.guild!.members.fetch(cmd.user);
    const config = await trpc.getCustomRolesConfig.query(cmd.guild!.id);
    if (!(await isSupporter(member, config))) throw "You do not have access to custom roles in this server.";

    const role = await trpc.getCustomRole.query({ guild: cmd.guild!.id, user: cmd.user.id });
    return { member, config, role };
}
