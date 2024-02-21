import { trpc } from "../api/index.js";
import type { GuildAutokickSettings } from "../types/index.js";
import type { GuildMember } from "discord.js";

export async function willAutokick(member: GuildMember, config?: GuildAutokickSettings) {
    config ??= await trpc.getAutokickConfig.query(member.guild.id);
    return Date.now() - member.user.createdTimestamp < config.minimumAge;
}
