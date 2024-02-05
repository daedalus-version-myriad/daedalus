import { DurationStyle, SpoilerLevel, code, copyFiles, copyMedia, embed, expand, formatDuration, getMuteRoleId, timeinfo, to } from "@daedalus/bot-utils";
import stickerCache from "@daedalus/bot-utils/sticker-cache";
import { permissions } from "@daedalus/data";
import { englishList } from "@daedalus/formatting";
import {
    AuditLogEvent,
    ChannelType,
    Collection,
    Colors,
    Guild,
    GuildEmoji,
    GuildMember,
    GuildScheduledEvent,
    Message,
    OverwriteType,
    PermissionsBitField,
    Role,
    Sticker,
    User,
    VoiceState,
    escapeMarkdown,
    type APIEmbed,
    type AnyThreadChannel,
    type GuildChannel,
    type MessageCreateOptions,
    type PartialGuildMember,
    type PartialGuildScheduledEvent,
    type PartialMessage,
    type PartialUser,
} from "discord.js";
import { invokeLog } from "./lib";
import { archiveDurations, audit, auditEntry, channelTypes, eventStatuses, fieldsFor } from "./utils";

export async function channelUpdate(before: GuildChannel, after: GuildChannel): Promise<MessageCreateOptions[]> {
    for (const section of [0, 1]) {
        const rows = [];

        if (section === 0) {
            if (before.name !== after.name) rows.push(`- name: ${code(before.name)} ${to} ${code(after.name)}`);
            if (before.type !== after.type) rows.push(`- type: ${code(channelTypes[before.type])} ${to} ${code(channelTypes[after.type])}`);

            if (before.parentId !== after.parentId)
                rows.push(
                    `- category: ${before.parent ? `${before.parent.name} (\`${before.parent.id}\`)` : "(none)"} ${to} ${
                        after.parent ? `${after.parent.name} (\`${after.parent.id}\`)` : "(none)"
                    }`,
                );

            if ("nsfw" in before && "nsfw" in after && before.nsfw !== after.nsfw)
                rows.push(`- NSFW: ${code(before.nsfw ? "on" : "off")} ${to} ${code(after.nsfw ? "on" : "off")}`);

            if ("topic" in before && "topic" in after && (before.topic || after.topic) && before.topic !== after.topic)
                rows.push(`- topic: ${before.topic ? code(`${before.topic}`) : "(none)"} ${to} ${after.topic ? code(`${after.topic}`) : "(none)"}`);

            if (
                "defaultAutoArchiveDuration" in before &&
                "defaultAutoArchiveDuration" in after &&
                before.defaultAutoArchiveDuration !== after.defaultAutoArchiveDuration
            )
                rows.push(
                    `- default auto-archive duration: ${code(archiveDurations[(before.defaultAutoArchiveDuration as keyof typeof archiveDurations) ?? 0])} ${to} ${code(
                        archiveDurations[(after.defaultAutoArchiveDuration as keyof typeof archiveDurations) ?? 0],
                    )}`,
                );

            if (before.isVoiceBased() && after.isVoiceBased()) {
                if (before.bitrate !== after.bitrate)
                    rows.push(`- bitrate: \`${Math.floor(before.bitrate / 1000)}kbps\` ${to} \`${Math.floor(after.bitrate / 1000)}kbps\``);

                if (before.rtcRegion !== after.rtcRegion) rows.push(`- RTC region: \`${before.rtcRegion}\` ${to} \`${after.rtcRegion}\``);
                if (before.userLimit !== after.userLimit) rows.push(`- user limit: \`${before.userLimit}\` ${to} \`${after.userLimit}\``);
            }

            if (before.isTextBased() && after.isTextBased() && (before.rateLimitPerUser ?? 0) !== (after.rateLimitPerUser ?? 0))
                rows.push(`- slowmode: ${formatDuration((before.rateLimitPerUser ?? 0) * 1000)} ${to} ${formatDuration((after.rateLimitPerUser ?? 0) * 1000)}`);
        } else {
            const permsBefore = new Map<string, string>();
            const permsAfter = new Map<string, string>();

            for (const [channel, perms] of [
                [before, permsBefore],
                [after, permsAfter],
            ] satisfies [GuildChannel, Map<string, string>][]) {
                for (const overwrites of channel.permissionOverwrites.cache.values()) {
                    const label = `<@${{ [OverwriteType.Role]: "&", [OverwriteType.Member]: "" }[overwrites.type]}${overwrites.id}>`;

                    for (const [set, key] of [
                        [overwrites.allow, "✅"],
                        [overwrites.deny, "❌"],
                    ] satisfies [Readonly<PermissionsBitField>, string][])
                        for (const permission of set.toArray()) perms.set(`${label}: ${code(permission)}`, key);
                }
            }

            for (const key of [...new Set([...permsBefore.keys(), ...permsAfter.keys()])])
                if (permsBefore.get(key) !== permsAfter.get(key)) rows.push(`- ${key}: ${permsBefore.get(key) ?? "🟨"} ${to} ${permsAfter.get(key) ?? "🟨"}`);
        }

        if (rows.length === 0) continue;

        const entry =
            section === 0
                ? await auditEntry(after.guild, AuditLogEvent.ChannelUpdate, after)
                : (
                      await Promise.all(
                          ["Create", "Update", "Delete"].map((k) =>
                              auditEntry(after.guild, AuditLogEvent[`ChannelOverwrite${k}` as keyof typeof AuditLogEvent], after),
                          ),
                      )
                  )
                      .filter((x) => x)
                      .sort((a, b) => b!.createdTimestamp - a!.createdTimestamp)[0];

        const user = entry?.executor;

        const blocks = [`${expand(user, "System")} updated ${expand(after)}\n`];

        for (const row of rows) {
            const next = `${blocks.at(-1)}\n${row}`;
            if (next.length > 4096) blocks.push(row);
            else blocks[blocks.length - 1] = next;
        }

        return [embed("Channel Updated", blocks.shift()!, Colors.Blue), ...blocks.map((block) => embed("...continued", block, Colors.DarkButNotBlack))];
    }

    return [];
}

export async function emojiUpdate(before: GuildEmoji, after: GuildEmoji): Promise<MessageCreateOptions> {
    const user = await audit(after.guild, AuditLogEvent.EmojiUpdate, after);
    const enabled = after.roles.cache.filter((role) => !before.roles.cache.has(role.id));
    const disabled = before.roles.cache.filter((role) => !after.roles.cache.has(role.id));

    return {
        embeds: [
            {
                title: "Emoji Updated",
                description: `${expand(user, "System")} updated ${after} (:${after.name}: \`${after.id}\`)\n${
                    before.name !== after.name ? `\n- name: ${code(before.name ?? "")} ${to} ${code(after.name ?? "")}` : ""
                }${enabled.size > 0 ? `\n- enabled emoji for ${englishList([...enabled.values()])}` : ""}${
                    disabled.size > 0 ? `\n- disabled emoji for ${englishList([...disabled.values()])}` : ""
                }`,
                color: Colors.Blue,
                thumbnail: { url: after.url },
            },
        ],
    };
}

export async function handleMemberUpdate(before: PartialGuildMember | GuildMember, after: GuildMember) {
    const entry = await auditEntry(after.guild, AuditLogEvent.MemberUpdate, after);

    const user = entry?.executor;
    const reason = entry?.reason ? ` with reason code(${entry.reason})` : "";

    if (before.communicationDisabledUntilTimestamp !== after.communicationDisabledUntilTimestamp)
        if ((before.communicationDisabledUntilTimestamp ?? 0) <= Date.now())
            invokeLog("guildMemberTimeout", after.guild, () =>
                embed(
                    "Member Timed Out",
                    `${expand(user, "System")} timed out ${expand(after)} until ${timeinfo(after.communicationDisabledUntil!)}${reason}`,
                    Colors.Red,
                ),
            );
        else if ((after.communicationDisabledUntilTimestamp ?? 0) <= Date.now())
            invokeLog("guildMemberTimeoutRemove", after.guild, () =>
                embed(
                    "Member Timeout Removed",
                    `${expand(user, "System")} removed the timeout for ${expand(after)} originally until ${timeinfo(
                        before.communicationDisabledUntil!,
                    )}${reason}`,
                    Colors.Green,
                ),
            );
        else
            invokeLog("guildMemberTimeout", after.guild, () =>
                embed(
                    "Member Timeout Duration Changed",
                    `${expand(user, "System")} changed the timeout for ${expand(after)} from until ${timeinfo(
                        before.communicationDisabledUntil!,
                    )} to until ${timeinfo(after.communicationDisabledUntil!)}${reason}`,
                    Colors.Blue,
                ),
            );

    if (before.nickname !== after.nickname)
        invokeLog("guildMemberUpdateName", after.guild, () =>
            embed(
                "Member Display Name Changed",
                `${expand(user, "Unknown User")} changed ${user?.id === after.id ? "their own" : `${expand(after)}'s`} nickname from ${
                    before.nickname ? code(before.nickname) : "(none)"
                } to ${after.nickname ? code(after.nickname) : "(none)"}`,
                Colors.Blue,
            ),
        );

    const beforeAvatar = before.displayAvatarURL({ size: 256 });
    const afterAvatar = after.displayAvatarURL({ size: 256 });

    if (beforeAvatar !== afterAvatar)
        invokeLog("guildMemberUpdateAvatar", after.guild, () => ({
            embeds: [
                {
                    title: "Member Avatar Changed From...",
                    description: expand(after),
                    color: Colors.Blue,
                    thumbnail: { url: beforeAvatar },
                },
                { title: "...To", color: Colors.Blue, thumbnail: { url: afterAvatar } },
            ],
        }));

    if (!before.roles.cache.equals(after.roles.cache)) {
        const added = after.roles.cache.filter((role) => !before.roles.cache.has(role.id));
        const removed = before.roles.cache.filter((role) => !after.roles.cache.has(role.id));

        const roleEditEntry = await auditEntry(after.guild, AuditLogEvent.MemberRoleUpdate, after);
        const roleEditor = roleEditEntry?.executor;
        const reason = roleEditEntry?.reason ? ` with reason ${code(roleEditEntry.reason)}` : "";

        invokeLog("guildMemberUpdateRoles", after.guild, () =>
            embed(
                "Member Roles Updated",
                `${expand(roleEditor, "System")} updated ${roleEditor?.id === after.id ? "their own" : `${expand(after)}'s`} roles: ${[
                    ...added.map((x) => `+${x}`),
                    ...removed.map((x) => `-${x}`),
                ].join(", ")}`,
                Colors.Blue,
            ),
        );

        const muteRoleId = await getMuteRoleId(after.guild);

        if (muteRoleId) {
            const mutedBefore = before.roles.cache.has(muteRoleId);
            const mutedAfter = after.roles.cache.has(muteRoleId);

            if (!mutedBefore && mutedAfter)
                invokeLog("guildMemberMute", after.guild, () =>
                    embed("Member Muted", `${expand(roleEditor, "Unknown User")} muted ${expand(after)}${reason}`, Colors.Red),
                );
            else if (mutedBefore && !mutedAfter)
                invokeLog("guildMemberUnmute", after.guild, () =>
                    embed("Member Unmuted", `${expand(roleEditor, "Unknown User")} unmuted ${expand(after)}${reason}`, Colors.Green),
                );
        }
    }
}

export async function guildScheduledEventUpdate(
    before: GuildScheduledEvent | PartialGuildScheduledEvent,
    after: GuildScheduledEvent,
): Promise<MessageCreateOptions[]> {
    const user = await audit(after.guild!, AuditLogEvent.GuildScheduledEventUpdate, after);

    const embeds: APIEmbed[] = [
        {
            title: "Event Updated",
            description: `${expand(user, "Unknown User")} updated the event ${after.name}${after.channel ? ` in ${expand(after.channel)}` : ""}`,
            color: Colors.Blue,
        },
    ];

    const rows = [];

    if (before.name !== after.name) rows.push(`- name: ${code(`${before.name}`)} ${to} ${code(after.name)}`);

    if (before.channelId !== after.channelId)
        rows.push(
            `- location: ${before.channel ? expand(before.channel) : "(other location)"} ${to} ${after.channel ? expand(after.channel) : "(other location)"}`,
        );

    if (before.scheduledStartTimestamp !== after.scheduledStartTimestamp)
        rows.push(`- start: ${timeinfo(before.scheduledStartAt)} ${to} ${timeinfo(after.scheduledStartAt)}`);

    if (before.scheduledEndTimestamp !== after.scheduledEndTimestamp)
        rows.push(
            `- end: ${before.scheduledEndAt ? timeinfo(before.scheduledEndAt) : "(undefined)"} ${to} ${
                after.scheduledEndAt ? timeinfo(after.scheduledEndAt) : "(undefined)"
            }`,
        );

    if (before.description !== after.description) rows.push(`- description: ${before.description} ${to} ${after.description}`);

    if (before.status !== after.status) rows.push(`- status: ${code(eventStatuses[before.status ?? "unknown"])} ${to} ${code(eventStatuses[after.status])}`);

    if (rows.length > 0) embeds[0].description += `\n\n${rows.join("\n")}`;

    if (before.image !== after.image)
        if (before.image)
            if (after.image)
                embeds.push(
                    {
                        title: "Image Changed From...",
                        color: Colors.Blue,
                        image: { url: `https://cdn.discordapp.com/guild-events/${before.id}/${before.image}?size=3072` },
                    },
                    {
                        title: "...To",
                        color: Colors.Blue,
                        image: { url: `https://cdn.discordapp.com/guild-events/${after.id}/${after.image}?size=3072` },
                    },
                );
            else
                embeds.push({
                    title: "Image Removed",
                    color: Colors.Red,
                    image: { url: `https://cdn.discordapp.com/guild-events/${before.id}/${before.image}?size=3072` },
                });
        else
            embeds.push({
                title: "Image Added",
                color: Colors.Green,
                image: { url: `https://cdn.discordapp.com/guild-events/${after.id}/${after.image}?size=3072` },
            });

    if (rows.length === 0 && embeds.length === 1) return [];

    return [{ embeds }];
}

export async function guildUpdate(before: Guild, after: Guild): Promise<MessageCreateOptions[]> {
    const user = await audit(after, AuditLogEvent.GuildUpdate, after);

    const outputs: MessageCreateOptions[] = [];

    if (before.ownerId !== after.ownerId) {
        const previousOwner = await after.client.users.fetch(before.ownerId).catch(() => {});

        outputs.push(
            embed(
                "Ownership Transferred",
                `${expand(previousOwner, code(before.ownerId))} transferred ownership of the server to ${expand(await after.members.fetch(after.ownerId))}`,
                Colors.Gold,
            ),
        );
    }

    if (before.partnered !== after.partnered)
        outputs.push(
            after.partnered
                ? embed("Guild Became Partner", "This server is now a Discord partner", Colors.Green)
                : embed("Guild Lost Partnership", "This server is no longer a Discord partner", Colors.Red),
        );

    if (before.verified !== after.verified)
        outputs.push(
            after.verified
                ? embed("Guild Became Verified", "This guild is now verified", Colors.Green)
                : embed("Guild Lost Verification", "This server is no longer verified", Colors.Red),
        );

    function diff<T>(
        name: string,
        src: T,
        dst: T,
        translate: (item: T) => string | undefined | null = (x) => (x === undefined ? undefined : x === null ? null : `${x}`),
    ) {
        return src !== dst ? { name, value: `${translate(src) ?? "(none)"} ${to} ${translate(dst) ?? "(none)"}` } : [];
    }

    function diffByKey<T extends keyof Guild>(name: string, key: `${T}Id` extends keyof Guild ? T : never) {
        return before[`${key}Id` as keyof Guild] !== after[`${key}Id` as keyof Guild]
            ? { name, value: `${before[key] ?? "(none)"} ${to} ${after[key] ?? "(none)"}` }
            : [];
    }

    const fields = [
        diff("Name", before.name, after.name, code),
        diff("Description", before.description ?? "", after.description ?? "", code),
        diffByKey("AFK Channel", "afkChannel"),
        diff("AFK Timeout (seconds)", before.afkTimeout, after.afkTimeout, (x) => code(`${x}`)),
        diffByKey("Public Updates Channel", "publicUpdatesChannel"),
        diffByKey("Rules Channel", "rulesChannel"),
        diffByKey("System Channel", "systemChannel"),
        diffByKey("Widget Channel", "widgetChannel"),
        diff(
            "Default Message Notifications",
            before.defaultMessageNotifications,
            after.defaultMessageNotifications,
            (x) => ["`All Messages`", "`Only Mentions`"][x],
        ),
        diff(
            "Explicit Content Filter",
            before.explicitContentFilter,
            after.explicitContentFilter,
            (x) => ["`Disabled`", "`Members Without Roles`", "`All Members`"][x],
        ),
        diff("2FA Moderation Requirement", before.mfaLevel, after.mfaLevel, (x) => ["`Disabled`", "`Enabled`"][x]),
        diff("NSFW Level", before.nsfwLevel, after.nsfwLevel, (x) => ["`Default`", "`Explicit`", "`Safe`", "`Age Restricted"][x]),
        diff("Preferred Locale", before.preferredLocale, after.preferredLocale, code),
        diff("Boost Progress Bar", before.premiumProgressBarEnabled, after.premiumProgressBarEnabled, (x) => (x ? "`on`" : "`off`")),
        before.systemChannelFlags.bitfield !== after.systemChannelFlags.bitfield
            ? {
                  name: "System Channel Types",
                  value: ((x, y) =>
                      `\`\`\`diff\n${[...y.filter((k) => !x.includes(k)).map((k) => `+ ${k}`), ...x.filter((k) => !y.includes(k)).map((k) => `- ${k}`)].join(
                          "\n",
                      )}\n\`\`\``)(before.systemChannelFlags.toArray(), after.systemChannelFlags.toArray()),
              }
            : [],
        diff("Vanity URL Code", before.vanityURLCode, after.vanityURLCode, (x) => (x ? code(x) : "(none)")),
        diff(
            "Verification Level",
            before.verificationLevel,
            after.verificationLevel,
            (x) =>
                [
                    "`None`",
                    "`Low (require verified email)`",
                    "`Medium (require registered for 5 minutes)`",
                    "`High (require registered for 10 minutes)`",
                    "`Very High (require verified phone number)`",
                ][x],
        ),
        diff("Icon", before.iconURL(), after.iconURL()),
        diff("Banner", before.bannerURL(), after.bannerURL()),
        diff("Invite Splash Background", before.splashURL(), after.splashURL()),
    ].flat();

    if (fields.length !== 0)
        outputs.push({
            embeds: [{ title: "Guild Updated", description: `${expand(user, "System")} updated this server`, color: Colors.Blue, fields }],
        });

    return outputs;
}

export async function messageDelete(message: Message | PartialMessage, fileOnlyMode: boolean): Promise<MessageCreateOptions[]> {
    if (fileOnlyMode && message.attachments.size === 0 && message.stickers.size === 0) return [];

    const files = await copyMedia(message, SpoilerLevel.HIDE);

    const outputs: MessageCreateOptions[] = [
        {
            embeds: [
                {
                    title: "Message Deleted",
                    description: fileOnlyMode ? "" : message.content ?? "",
                    color: Colors.Red,
                    fields: fieldsFor(message),
                    url: message.url,
                    footer: message.stickers.size > 0 ? { text: `Sticker ID: ${message.stickers.map((sticker) => sticker.id).join(", ")}` } : undefined,
                },
            ],
            files: files.slice(0, 10),
        },
    ];

    if (files.length > 10)
        outputs.push({
            embeds: [
                {
                    title: "Additional Attachments",
                    description: "Attachments from the above message could not fit in one message.",
                    color: Colors.Red,
                },
            ],
            files: files.slice(10),
        });

    return outputs;
}

export async function messageBulkDelete(messages: Collection<string, Message | PartialMessage>, fileOnlyMode: boolean): Promise<MessageCreateOptions[]> {
    const references: MessageCreateOptions[] = [];
    const rows: string[] = [];

    let index = 0;

    for (const message of messages.toJSON().reverse()) {
        const files = await copyMedia(message, SpoilerLevel.HIDE);

        if (files.length > 0)
            references.push({
                embeds: [{ title: `Files for message ${++index}`, color: Colors.Purple }],
                files: files.slice(0, 10),
            });

        if (files.length > 10)
            references.push({
                embeds: [
                    {
                        title: `Additional files for message ${index}`,
                        description: `Attachments from message ${index} could not fit in one message.`,
                        color: Colors.Purple,
                    },
                ],
                files: files.slice(10),
            });

        let line: string;

        if (fileOnlyMode) {
            if (files.length === 0) continue;
            line = `${message.author} (${message.author?.tag}) [${index}]`;
        } else line = `${message.author} (${message.author?.tag})${files.length > 0 ? ` [${index}]` : ""}: ${escapeMarkdown(message.content ?? "")}`;

        rows.push(line.slice(0, 4096));
        if (line.length > 4096) rows.push(line.slice(4096));
    }

    if (rows.length === 0) return [];

    const blocks = [rows.shift()!];

    for (const row of rows) {
        const next = `${blocks.at(-1)}\n${row}`;
        if (next.length > 4096) blocks.push(row);
        else blocks[blocks.length - 1] = next;
    }

    return [...blocks.map((block) => ({ embeds: [{ title: "Purged Messages", description: block, color: Colors.Purple }] })), ...references];
}

export async function messageUpdate(before: Message | PartialMessage, after: Message | PartialMessage, fileOnlyMode: boolean): Promise<MessageCreateOptions[]> {
    if ((fileOnlyMode || (before.content ?? "") === (after.content ?? "")) && before.attachments.size === after.attachments.size) return [];

    const files = copyFiles(before.attachments.filter((attachment) => !after.attachments.has(attachment.id)).toJSON(), SpoilerLevel.HIDE);
    const long = (before.content?.length ?? 0) > 1024 || (after.content?.length ?? 0) > 1024;

    const embeds: APIEmbed[] = [
        {
            title: "Message Updated",
            description: files.length === 0 ? "" : `${files.length === 1 ? "An attachment was" : "Attachments were"} removed from this message.`,
            color: Colors.Blue,
            fields: [
                fieldsFor(after),
                fileOnlyMode || long || before.content === after.content
                    ? []
                    : [before.content ? { name: "Before", value: before.content } : [], after.content ? { name: "After", value: after.content } : []].flat(),
            ].flat(),
            url: after.url,
        },
        !fileOnlyMode && long && before.content !== after.content
            ? [
                  { title: "Before", description: before.content ?? "", color: Colors.Blue },
                  { title: "After", description: after.content ?? "", color: Colors.Blue },
              ]
            : [],
    ].flat();

    const length = embeds
        .map(
            (e) =>
                (e.title?.length ?? 0) + (e.description?.length ?? 0) + (e.fields ?? []).map((f) => f.name.length + f.value.length).reduce((x, y) => x + y, 0),
        )
        .reduce((x, y) => x + y);

    return length > 6000 ? [{ embeds: [embeds.shift()!], files }, ...embeds.map((embed) => ({ embeds: [embed] }))] : [{ embeds, files }];
}

export async function roleUpdate(before: Role, after: Role): Promise<MessageCreateOptions | MessageCreateOptions[]> {
    const user = await audit(after.guild, AuditLogEvent.RoleUpdate, after);

    const rows: string[] = [];
    let thumbnail: { url: string } | undefined;

    if (before.name !== after.name) rows.push(`- name: ${code(before.name)} ${to} ${code(after.name)}`);
    if (before.color !== after.color) rows.push(`- color: ${code(before.hexColor)} ${to} ${code(after.hexColor)}`);

    if (before.hoist && !after.hoist) rows.push(`- role no longer appears separately on the member list (unhoisted)`);
    else if (!before.hoist && after.hoist) rows.push(`- role now appears separately on the member list (hoisted)`);

    if (before.mentionable && !after.mentionable) rows.push(`- role is no longer able to be pinged by everyone`);
    else if (!before.mentionable && after.mentionable) rows.push(`- role is now able to be pinged by everyone`);

    const afterIcon = after.iconURL();

    if (before.iconURL() !== afterIcon) {
        if (afterIcon) {
            rows.push(`- role icon changed to ${afterIcon}`);
            thumbnail = { url: afterIcon! };
        } else rows.push(`- role icon removed`);
    }

    if (!before.permissions.equals(after.permissions)) {
        const beforePerms = before.permissions.toArray();
        const afterPerms = after.permissions.toArray();

        const added = afterPerms.filter((x) => !beforePerms.includes(x));
        const removed = beforePerms.filter((x) => !afterPerms.includes(x));

        rows.push(
            `- permissions have been changed:\n\`\`\`diff\n${[
                ...added.map((x) => `+ ${permissions[x]?.name ?? x}`),
                ...removed.map((x) => `- ${permissions[x]?.name ?? x}`),
            ].join("\n")}\n\`\`\``,
        );
    }

    if (rows.length === 0) return [];

    return {
        embeds: [
            {
                title: "Role Updated",
                description: `${expand(user, "System")} updated ${expand(after)}\n\n${rows.join("\n")}`,
                color: Colors.Blue,
                thumbnail,
            },
        ],
    };
}

export async function stickerUpdate(before: Sticker, after: Sticker): Promise<MessageCreateOptions | MessageCreateOptions[]> {
    if (before.name === after.name && before.description === after.description) return [];

    const user = await audit(after.guild!, AuditLogEvent.StickerUpdate, after);
    const url = await stickerCache.fetch(after);

    return {
        embeds: [
            {
                title: "Sticker Updated",
                description: `${expand(user, "Unknown User")} updated ${after.name} (\`${after.id}\`)\n${
                    before.name === after.name ? "" : `\n- name: ${code(before.name)} ${to} ${code(after.name)}`
                }${
                    before.description === after.description
                        ? ""
                        : `\n- description: ${before.description ? code(before.description) : "(none)"} ${to} ${
                              after.description ? code(after.description) : "(none)"
                          }`
                }`,
                color: Colors.Blue,
            },
        ],
        files: url ? [{ attachment: url }] : [],
    };
}

export async function threadUpdate(before: AnyThreadChannel, after: AnyThreadChannel): Promise<MessageCreateOptions | MessageCreateOptions[]> {
    const user = await audit(after.guild, AuditLogEvent.ThreadUpdate, after);
    const rows: string[] = [];

    if (before.name !== after.name) rows.push(`- name: ${code(before.name)} ${to} ${code(after.name)}`);

    if (before.locked && !after.locked) rows.push(`- unlocked`);
    else if (!before.locked && after.locked) rows.push(`- locked`);

    if (before.archived && !after.archived) rows.push(`- unarchived`);
    else if (!before.archived && after.archived) rows.push(`- archived`);

    if (before.autoArchiveDuration !== after.autoArchiveDuration)
        rows.push(
            `- auto-archive duration: ${code(archiveDurations[before.autoArchiveDuration ?? 0])} ${to} ${code(
                archiveDurations[after.autoArchiveDuration ?? 0],
            )}`,
        );

    if (before.rateLimitPerUser !== after.rateLimitPerUser)
        rows.push(
            `- slowmode: ${formatDuration((before.rateLimitPerUser ?? 0) * 1000, DurationStyle.Blank)} ${to} ${formatDuration(
                (after.rateLimitPerUser ?? 0) * 1000,
                DurationStyle.Blank,
            )}`,
        );

    if (rows.length === 0) return [];

    const forum = after.parent!.type === ChannelType.GuildForum;

    return embed(
        forum ? "Forum Post Updated" : "Thread Updated",
        `${expand(user, "System")} updated ${expand(after)}${
            forum ? "" : ` (${after.type === ChannelType.PublicThread ? "public" : "private"})`
        }\n\n${rows.join("\n")}`,
        Colors.Blue,
    );
}

export async function handleUserUpdate(before: User | PartialUser, after: User) {
    const beforeAvatar = before.displayAvatarURL({ size: 256 });
    const afterAvatar = after.displayAvatarURL({ size: 256 });

    if (beforeAvatar !== afterAvatar || before.username !== after.username) {
        const members = after.client.guilds.cache.map((guild) => guild.members.cache.get(after.id) ?? []).flat();
        if (members.length === 0) return;

        if (before.username !== after.username)
            for (const member of members)
                invokeLog("guildMemberUpdateName", member.guild, () =>
                    embed(
                        "Username Changed",
                        `${expand(after)} changed their username from ${code(before.username ?? "(unknown)")} to ${code(after.username)}`,
                        Colors.Blue,
                    ),
                );

        if (beforeAvatar !== afterAvatar)
            for (const member of members)
                invokeLog("guildMemberUpdateAvatar", member.guild, () => ({
                    embeds: [
                        {
                            title: "User Avatar Changed From...",
                            description: expand(after),
                            color: Colors.Blue,
                            thumbnail: { url: beforeAvatar },
                        },
                        {
                            title: "...To",
                            color: Colors.Blue,
                            thumbnail: { url: afterAvatar },
                        },
                    ],
                }));
    }
}

export async function handleVoiceStateUpdate(before: VoiceState, after: VoiceState) {
    if (before.channel)
        if (after.channel)
            if (before.channel.id === after.channel.id)
                invokeLog("voiceStateUpdate", after.channel ?? after.guild, async () => {
                    const user = await audit(after.guild, AuditLogEvent.MemberUpdate, after.member);

                    const changes: string[] = [];

                    if (before.selfVideo !== after.selfVideo) changes.push(`turned their camera ${after.selfVideo ? "on" : "off"}`);
                    if (before.streaming !== after.streaming) changes.push(`${after.streaming ? "started" : "stopped"} streaming`);
                    if (before.selfMute !== after.selfMute) changes.push(`${after.selfMute ? "" : "un"}muted themselves`);
                    if (before.selfDeaf !== after.selfDeaf) changes.push(`${after.selfDeaf ? "" : "un"}deafened themselves`);

                    if (before.serverMute !== after.serverMute)
                        changes.push(`was ${after.serverMute ? "suppressed" : "permitted to speak"} by ${expand(user)}`);

                    if (before.serverDeaf !== after.serverDeaf) changes.push(`was server-${after.serverDeaf ? "" : "un"}deafened by ${expand(user)}`);
                    if (before.suppress !== after.suppress) changes.push(`became ${after.suppress ? "an audience member" : "a speaker"}`);

                    if (changes.length === 0) return [];

                    return embed("Voice State Updated", `${expand(after.member)} ${englishList(changes)}`, Colors.Blue);
                });
            else
                invokeLog("voiceMove", after.channel ?? after.guild, async () => {
                    const user = await audit(after.guild, AuditLogEvent.MemberMove);

                    return embed(
                        "Voice Channel Changed",
                        `${expand(after.member)} ${user ? "was (maybe) " : ""}moved from ${expand(before.channel)} to ${expand(after.channel)}${
                            user ? ` by ${expand(user)}` : ""
                        }`,
                        Colors.Blue,
                    );
                });
        else
            invokeLog("voiceLeave", before.channel ?? before.guild, async () => {
                const user = await audit(before.guild, AuditLogEvent.MemberDisconnect);

                return embed(
                    "Voice Disconnect",
                    `${expand(before.member)} ${user ? "was (maybe) kicked from" : "left"} ${expand(before.channel)}${user ? ` by ${expand(user)}` : ""}`,
                    Colors.Red,
                );
            });
    else
        invokeLog("voiceJoin", after.channel ?? after.guild, () =>
            embed("Voice Connect", `${expand(after.member)} joined ${expand(after.channel)}`, Colors.Green),
        );
}
