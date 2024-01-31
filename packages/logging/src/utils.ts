import { expand, timestamp } from "@daedalus/bot-utils";
import {
    ChannelType,
    GuildScheduledEventStatus,
    Message,
    type APIEmbedField,
    type Guild,
    type GuildAuditLogsEntry,
    type GuildAuditLogsResolvable,
    type PartialMessage,
} from "discord.js";

export async function auditEntry(guild: Guild, type: GuildAuditLogsResolvable, target?: any, key: string = "id"): Promise<GuildAuditLogsEntry | null> {
    const time = Date.now();

    try {
        const logs = (await guild.fetchAuditLogs({ type })).entries;

        if (!target) {
            const entry = logs.first();
            if (!entry) return null;

            if (time - entry.createdTimestamp <= 10000) return entry;
            return null;
        }

        target = target[key] ?? target;

        for (const entry of logs.values()) {
            if (time - entry.createdTimestamp > 10000) return null;
            if (entry.target && key in entry.target && entry.target[key as keyof typeof entry.target] === target) return entry;
        }
    } catch (error) {
        console.error(error);
    }

    return null;
}

export async function audit(guild: Guild, type: GuildAuditLogsResolvable, target?: any, key: string = "id") {
    return (await auditEntry(guild, type, target, key))?.executor;
}

export const to = "→";

export const channelTypes: Record<ChannelType, string> = {
    [ChannelType.AnnouncementThread]: "announcement thread",
    [ChannelType.DM]: "DM channel",
    [ChannelType.GroupDM]: "group DM channel",
    [ChannelType.GuildAnnouncement]: "announcement channel",
    [ChannelType.GuildCategory]: "category channel",
    [ChannelType.GuildDirectory]: "directory channel",
    [ChannelType.GuildForum]: "forum channel",
    [ChannelType.GuildStageVoice]: "stage channel",
    [ChannelType.GuildText]: "text channel",
    [ChannelType.GuildVoice]: "voice channel",
    [ChannelType.PrivateThread]: "private thread",
    [ChannelType.PublicThread]: "public thread",
    [ChannelType.GuildMedia]: "media channel",
};

export const archiveDurations = {
    0: "Default (3 days)",
    60: "1 hour",
    1440: "1 day",
    4320: "3 days",
    10080: "7 days",
};

export const eventStatuses: Record<GuildScheduledEventStatus | "unknown", string> = {
    unknown: "Unknown",
    [GuildScheduledEventStatus.Active]: "Active",
    [GuildScheduledEventStatus.Canceled]: "Canceled",
    [GuildScheduledEventStatus.Completed]: "Completed",
    [GuildScheduledEventStatus.Scheduled]: "Scheduled",
};

export function fieldsFor(message: Message | PartialMessage): APIEmbedField[] {
    return [
        message.reference
            ? {
                  name: "Reference",
                  value: `https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}`,
              }
            : [],
        { name: "Details", value: `Posted on ${timestamp(message.createdAt)} by ${expand(message.author)} in ${expand(message.channel)}` },
    ].flat();
}
