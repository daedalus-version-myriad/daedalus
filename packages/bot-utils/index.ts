import { trpc } from "@daedalus/api";
import { secrets } from "@daedalus/config";
import {
    Attachment,
    ButtonStyle,
    ChannelType,
    Colors,
    ComponentType,
    GuildChannel,
    GuildMember,
    Message,
    Role,
    User,
    escapeMarkdown,
    type AttachmentPayload,
    type BaseMessageOptions,
    type Channel,
    type Client,
    type Guild,
    type PartialMessage,
} from "discord.js";
import stickerCache from "./sticker-cache";

export const mdash = "—";

export async function isAssignedClient(client: Client, guild: Guild | string) {
    const id = typeof guild === "string" ? guild : guild.id;
    const token = await trpc.vanityClientGet.query(id);
    return client.token === (token ?? secrets.DISCORD.TOKEN);
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
        ...embed("Confirm", body, 0xaa4477, ephemeral),
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

export function englishList(list: any[], separator = "and"): string {
    return list.length === 0
        ? ""
        : list.length === 1
          ? `${list[0]}`
          : list.length === 2
            ? `${list[0]} ${separator} ${list[1]}`
            : `${list.slice(0, -1).join(", ")}, ${separator} ${list[list.length - 1]}`;
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
