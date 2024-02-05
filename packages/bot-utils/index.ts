import { trpc } from "@daedalus/api";
import { secrets } from "@daedalus/config";
import { formatMessage } from "@daedalus/custom-messages";
import type { PremiumBenefits } from "@daedalus/data";
import { commandMap, modules, permissions } from "@daedalus/data";
import { logError } from "@daedalus/log-interface";
import type { CustomMessageContext, ParsedMessage } from "@daedalus/types";
import type Argentium from "argentium";
import {
    Attachment,
    ButtonStyle,
    ChannelType,
    Client,
    Colors,
    ComponentType,
    Guild,
    GuildChannel,
    GuildMember,
    Message,
    PermissionFlagsBits,
    Role,
    User,
    escapeMarkdown,
    type APIInteractionGuildMember,
    type AttachmentPayload,
    type Awaitable,
    type BaseMessageOptions,
    type Channel,
    type InteractionEditReplyOptions,
    type InteractionReplyOptions,
    type MessageCreateOptions,
    type PartialMessage,
    type RepliableInteraction,
    type TextBasedChannel,
} from "discord.js";
import stickerCache from "./sticker-cache";
export const mdash = "—";
export const to = "→";

export async function isWrongClient(client: Client, guild: Guild | string) {
    const id = typeof guild === "string" ? guild : guild.id;
    const token = await trpc.vanityClientGet.query(id);

    return client.token !== (token ?? secrets.DISCORD.TOKEN);
}

export async function isModuleDisabled(guild: Guild | string, module: string) {
    return !(await trpc.isModuleEnabled.query({ guild: typeof guild === "string" ? guild : guild.id, module }));
}

export async function getColor(guild: Guild | string) {
    return await trpc.getColor.query(typeof guild === "string" ? guild : guild.id);
}

export async function getMuteRoleId(guild: Guild | string) {
    return await trpc.getMuteRole.query(typeof guild === "string" ? guild : guild.id);
}

export function getChannelStack(channel: Channel): string[] {
    if (channel.isDMBased() || channel.type === ChannelType.GuildCategory || !channel.parent) return [channel.id];
    return [channel.id, ...getChannelStack(channel.parent)];
}

export const template = {
    success: (body: string, ephemeral?: boolean) => embed("OK!", body, Colors.Green, ephemeral),
    error: (body: string, ephemeral?: boolean) => embed("Error!", body, Colors.Red, ephemeral),
    info: (body: string, ephemeral?: boolean) => embed("Info", body, Colors.Blue, ephemeral),
    progress: (body: string, ephemeral?: boolean) => embed("In Progress", body, Colors.Purple, ephemeral),
    logerror: (context: string, body: string, ephemeral?: boolean) => embed(`Bot Error: ${context}`, body, Colors.Red, ephemeral),
    confirm: (
        body: string,
        user: string,
        key: string,
        { yesLabel, noLabel, ephemeral }: { yesLabel?: string; noLabel?: string; ephemeral?: boolean } = {},
    ): BaseMessageOptions => ({
        ...embed("Confirm", body, Colors.DarkVividPink, ephemeral),
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    { type: ComponentType.Button, customId: `:${user}:${key}`, style: ButtonStyle.Success, label: yesLabel ?? "Confirm" },
                    { type: ComponentType.Button, customId: `:${user}:cancel`, style: ButtonStyle.Danger, label: noLabel ?? "Cancel" },
                ],
            },
        ],
    }),
};

export function embed(title: string, description: string, color: number, ephemeral: boolean = true): BaseMessageOptions & { ephemeral: boolean } {
    return { content: "", embeds: [{ title, description, color }], files: [], components: [], ephemeral };
}

export function expand(item: any, ifAbsent?: string): string {
    if (item instanceof GuildChannel) return `${item} (${escapeMarkdown(item.name)} \`${item.id}\`)`;
    if (item instanceof GuildMember) return `${item} (${escapeMarkdown(item.user.tag)} \`${item.id}\`)`;
    if (item instanceof User) return `${item} (${escapeMarkdown(item.tag)} \`${item.id}\`)`;
    if (item instanceof Role) return `${item} (${escapeMarkdown(item.name)} \`${item.id}\`)`;

    return item || ifAbsent || `${item}`;
}

export function code(x: string): string {
    if (!x) return x;
    if (x.indexOf("`") === -1) return `\`${x}\``;
    if (x.indexOf("``") === -1) return `\`\` ${x} \`\``;
    return `\`\`${x.replaceAll("`", "\u200b`")}\`\``;
}

export function timestamp(date: number | Date, format?: "t" | "T" | "d" | "D" | "f" | "F" | "R"): string {
    return `<t:${Math.floor((typeof date === "number" ? date : date.getTime()) / 1000)}${format ? `:${format}` : ""}>`;
}

export function timeinfo(date: number | Date | undefined | null) {
    if (!date) return "(unknown time)";
    return `${timestamp(date)} (${timestamp(date, "R")})`;
}

export function idlist(ids: string[]): string {
    let display = "";

    for (let x = 0; x < ids.length; x += 4) {
        display += `${ids
            .slice(x, x + 4)
            .map((x) => x.padStart(20))
            .join(" ")}\n`;
    }

    return display;
}

export function ordinal(x: number): string {
    if (x < 0) return `-${ordinal(-x)}`;

    if (x === 0 || (x > 10 && x < 20)) return `${x}th`;
    if (x % 10 === 1) return `${x}st`;
    if (x % 10 === 2) return `${x}nd`;
    if (x % 10 === 3) return `${x}rd`;
    return `${x}th`;
}

export function truncate(string: string, length: number): string {
    return string.length > length ? `${string.slice(0, length - 3)}...` : string;
}

export function formatIdList(ids: string[]): string {
    let display = "";

    for (let x = 0; x < ids.length; x += 4) {
        display += `${ids
            .slice(x, x + 4)
            .map((x) => x.padStart(20))
            .join(" ")}\n`;
    }

    return display;
}

export enum DurationStyle {
    Blank,
    For,
    Until,
}

const timescales: [string, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
];

export function formatDuration(duration: number, style = DurationStyle.For): string {
    if (duration === Infinity) return "indefinitely";

    duration = Math.round(duration / 1000);

    if (duration < 0) {
        const core = _formatDuration(-duration);
        if (style === DurationStyle.Blank) return `negative ${core}`;
        if (style === DurationStyle.For) return `for negative ${core}`;
        if (style === DurationStyle.Until) return `until ${core} ago`;
    }

    if (duration === 0) {
        if (style === DurationStyle.Blank) return "no time";
        if (style === DurationStyle.For) return "for no time";
        if (style === DurationStyle.Until) return "until right now";
    }

    const core = _formatDuration(duration);
    if (style === DurationStyle.Blank) return core;
    if (style === DurationStyle.For) return `for ${core}`;
    if (style === DurationStyle.Until) return `until ${core} from now`;

    return "??";
}

function _formatDuration(duration: number): string {
    if (duration === Infinity) return "indefinitely";

    const parts: string[] = [];

    for (const [name, scale] of timescales) {
        if (duration >= scale) {
            const amount = Math.floor(duration / scale);
            duration %= scale;

            parts.push(`${amount} ${name}${amount === 1 ? "" : "s"}`);
        }
    }

    return parts.join(" ");
}

export enum SpoilerLevel {
    SHOW = -1,
    KEEP = 0,
    HIDE = 1,
}

export function copyFiles(files: Iterable<Attachment>, spoilerLevel: SpoilerLevel): AttachmentPayload[] {
    const attachments: AttachmentPayload[] = [];

    for (const attachment of files) {
        let { name } = attachment;
        const spoiler = name.startsWith("SPOILER_");
        name = name.match(/^(SPOILER_)*(.*)$/)![2] || "file";
        if ((spoilerLevel === SpoilerLevel.KEEP && spoiler) || spoilerLevel === SpoilerLevel.HIDE) name = `SPOILER_${name}`;
        attachments.push({ attachment: attachment.url, name });
    }

    return attachments;
}

export async function copyMedia(message: Message | PartialMessage, spoilerLevel: SpoilerLevel, tracker?: [boolean]): Promise<AttachmentPayload[]> {
    const attachments = copyFiles(message.attachments.values(), spoilerLevel);

    for (const sticker of message.stickers.values())
        try {
            const path = await stickerCache.fetch(sticker);

            if (path) attachments.push({ attachment: path, name: `${spoilerLevel > 0 ? "SPOILER_" : ""}${sticker.name}.${stickerCache.ext(sticker)}` });
            else throw 0;
        } catch {
            attachments.push({ attachment: Buffer.from([]), name: `${spoilerLevel > 0 ? "SPOILER_" : ""}${sticker.name}.${stickerCache.ext(sticker)}` });
            if (tracker) tracker[0] = true;
        }

    return attachments;
}

export async function getTextChannel(guild: Guild, id: string, moduleTitle: string, contextName: string) {
    const channel = await guild.channels.fetch(id, { force: true }).catch(() => null);

    if (!channel)
        return await logError(
            guild.id,
            `${moduleTitle} Module`,
            `The ${contextName} channel (<#${id}>) could not be fetched. Please check that the bot has permission to view it, and if it has been deleted, update the settings on the [dashboard](${secrets.DOMAIN}/manage/${guild.id}).`,
        );

    if (!channel.isTextBased())
        return await logError(
            guild.id,
            `${moduleTitle} Module`,
            `The ${contextName} channel (${channel}) is not of a valid channel type. This should not be possible unless the data was tampered with outside of the dashboard; please contact support.`,
        );

    return channel;
}

export async function sendCustomMessage(
    location: TextBasedChannel | Message,
    data: ParsedMessage,
    moduleTitle: string,
    errorMessage: string,
    context?: CustomMessageContext,
    allowPings?: boolean,
    pingInReply?: boolean,
) {
    const channel = location instanceof Message ? location.channel : location;

    try {
        const message = await formatMessage(data, context ?? {}, allowPings);

        if (location instanceof Message) {
            if (pingInReply) (message.allowedMentions ??= {}).repliedUser = true;
            await location.reply(message);
        } else await channel.send(message);
    } catch (error) {
        if (channel.isDMBased()) return;

        await logError(
            channel.guild.id,
            `Custom Message: ${moduleTitle} Module`,
            `${errorMessage} Check the bot's permissions in ${channel} and ensure your custom message is valid. Here are some details about the error:\n\`\`\`\n${error}\n\`\`\``,
        );
    }
}

export async function sendMessage(channel: TextBasedChannel, data: MessageCreateOptions, moduleTitle: string, errorMessage: string) {
    try {
        return await channel.send(data);
    } catch (error) {
        if (channel.isDMBased()) return;

        await logError(
            channel.guild.id,
            `Sending Message: ${moduleTitle} Module`,
            `${errorMessage} Check the bot's permissions in ${channel}. Here are some details about the error:\n\`\`\`\n${error}\n\`\`\``,
        );
    }
}

export async function fetchAndSendCustom(
    guild: Guild,
    id: string,
    moduleTitle: string,
    contextName: string,
    data: ParsedMessage,
    errorMessage: string,
    context?: () => Awaitable<CustomMessageContext>,
    allowPings?: boolean,
) {
    const channel = await getTextChannel(guild, id, moduleTitle, contextName);
    if (channel) await sendCustomMessage(channel, data, moduleTitle, errorMessage, await context?.(), allowPings);
}

export async function fetchAndSendMessage(
    guild: Guild,
    id: string,
    moduleTitle: string,
    contextName: string,
    data: MessageCreateOptions,
    errorMessage: string,
) {
    const channel = await getTextChannel(guild, id, moduleTitle, contextName);
    if (channel) await sendMessage(channel, data, moduleTitle, errorMessage);
}

export async function obtainLimit(guild: string, key: keyof PremiumBenefits) {
    return await trpc.obtainLimit.query({ guild, key });
}

export async function reply(interaction: RepliableInteraction, message: (InteractionEditReplyOptions & InteractionReplyOptions) | string) {
    if (interaction.replied) return await interaction.followUp(message);
    else if (interaction.deferred) return await interaction.editReply(message);
    else return await interaction.reply(message);
}

export type Commands = Argentium["commands"] extends (fn: (cu: infer T) => unknown) => unknown ? T : never;

export function defer(ephemeral: boolean) {
    return async <T extends { _: RepliableInteraction }>(data: T) => (await data._.deferReply({ ephemeral }), data);
}

export async function enforcePermissions(user: User, name: string, channel: Channel, bypass?: boolean) {
    const reason = await checkPermissions(user, name, channel, bypass);
    if (reason) throw reason;
}

export async function checkPermissions(user: User | GuildMember, name: string, channel: Channel, bypass?: boolean): Promise<string | false> {
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
