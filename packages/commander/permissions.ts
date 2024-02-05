import { trpc } from "@daedalus/api";
import { isModuleDisabled } from "@daedalus/bot-utils";
import { commandMap, modules, permissions } from "@daedalus/data";
import { Client, Guild, GuildMember, PermissionFlagsBits, User, type APIInteractionGuildMember, type Channel } from "discord.js";

export async function enforcePermissions(user: User, name: string, channel: Channel, bypass?: boolean) {
    const reason = await check(user, name, channel, bypass);
    if (reason) throw reason;
}

export async function check(user: User | GuildMember, name: string, channel: Channel, bypass?: boolean): Promise<string | false> {
    let member = user instanceof GuildMember ? user : null;
    if (channel.isDMBased()) return false;

    const command = commandMap[name];
    const req = command?.permissions ?? [];

    const commandSettings = await trpc.getCommandPermissionSettings.query({ guild: channel.guild.id, command: name });

    if (await isModuleDisabled(channel.guild, command.module)) return `The ${modules[command.module].name} module is disabled.`;
    if (!commandSettings.enabled) return `The ${command.name} command is disabled.`;

    if (!(bypass ?? command.bypass)) {
        const required = (Array.isArray(req) ? req : [req]).filter((x) => x).map((key) => PermissionFlagsBits[key as keyof typeof PermissionFlagsBits]);

        try {
            member ??= await channel.guild.members.fetch(user);
            const roles = [...member.roles.cache.keys()];

            const guildSettings = await trpc.getGlobalCommandSettings.query(channel.guild.id);

            if (guildSettings) {
                if (
                    channel.guild.ownerId !== user.id &&
                    (guildSettings.blockedRoles.some((id: string) => roles.includes(id)) ||
                        (guildSettings.modOnly && !guildSettings.allowedRoles.some((id: string) => roles.includes(id))))
                )
                    return "You are not permitted to use this bot's commands in this server.";

                let current: Channel | null = channel;
                let allowed = false;

                while (current) {
                    if (guildSettings.blockedChannels.includes(current.id)) return "Commands are not permitted in this channel.";
                    allowed ||= guildSettings.allowedChannels.includes(current.id);
                    current = current.parent;
                }

                if (guildSettings.allowlistOnly && !allowed) return "Commands are not permitted in this channel.";
            }

            if (
                channel.guild.ownerId !== user.id &&
                (commandSettings.ignoreDefaultPermissions ||
                    !channel.permissionsFor(member).has(required) ||
                    commandSettings.blockedRoles.some((id: string) => roles.includes(id))) &&
                !commandSettings.allowedRoles.some((id: string) => roles.includes(id))
            )
                return "You do not have permission to use that command.";

            let current: Channel | null = channel;

            while (current) {
                if (commandSettings.allowedChannels.includes(current.id)) break;
                if (commandSettings.blockedChannels.includes(current.id)) return "This command is not permitted in this channel.";

                current = current.parent;
                if (!current && commandSettings.restrictChannels) return "This command is not permitted in this channel.";
            }

            if (
                !channel
                    .permissionsFor(channel.guild.members.me!)
                    .has((command.selfPermissions ?? []).map((key) => PermissionFlagsBits[key as keyof typeof PermissionFlagsBits]))
            )
                return `The bot is missing required permissions: ${command.selfPermissions?.map((x) => permissions[x as keyof typeof permissions].name).join(", ")}`;
        } catch (error) {
            console.error(error);
            return "An unknown error occurred trying to verify your permissions.";
        }
    }

    return false;
}

export async function checkPunishment(
    ctx: { client: Client; guild: Guild | null; member: GuildMember | APIInteractionGuildMember | null },
    target: User | GuildMember,
    action: "warn" | "mute" | "timeout" | "kick" | "ban",
) {
    if (!ctx.guild || !ctx.member) throw "Context is not in a guild. This error should not happen; please contact support.";

    const member = await ctx.guild.members.fetch(ctx.member.user.id).catch(() => {
        throw "An error occurred fetching you from the guild.";
    });

    if (member.id === target.id) throw `You cannot ${action} yourself.`;

    if (member.id === ctx.client.user!.id)
        throw action === "warn"
            ? "You cannot warn the bot using its commands. If there are issues with its functionality, please report it in the Daedalus support server [here](https://discord.gg/7TRKfSK7EU)."
            : `The bot cannot ${action} itself, so if you wish to do so, do so manually.`;

    let targetMember: GuildMember;

    try {
        targetMember = target instanceof GuildMember ? target : await ctx.guild.members.fetch(target);
    } catch {
        return;
    }

    if (targetMember.id === ctx.guild.ownerId) throw `You cannot ${action} the server owner.`;

    if (action === "timeout" && targetMember.permissions.has(PermissionFlagsBits.Administrator)) throw "You cannot timeout server administrators.";

    if (ctx.guild.ownerId !== member.id) {
        const cmp = member.roles.highest.comparePositionTo(targetMember.roles.highest);

        if (cmp < 0)
            throw `${targetMember} is higher in role hierarchy than you, so you cannot ${action} them (${targetMember.roles.highest} > ${member.roles.highest}).`;

        if (cmp === 0) throw `${targetMember} is equal in role hierarchy to you, so you cannot ${action} them (highest role: ${member.roles.highest}).`;
    }

    if ((action === "ban" && !targetMember.bannable) || (action === "kick" && !targetMember.kickable) || (action === "timeout" && !targetMember.moderatable))
        throw `${targetMember} is higher than or equal to the bot in role hierarchy, so it cannot ${action} them.`;
}
