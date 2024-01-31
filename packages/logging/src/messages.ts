import { SpoilerLevel, code, copyMedia, embed, englishList, expand, formatDuration, getMuteRoleId, timeinfo } from "@daedalus/bot-utils";
import {
    AuditLogEvent,
    Collection,
    Colors,
    Guild,
    GuildEmoji,
    GuildMember,
    GuildScheduledEvent,
    Message,
    OverwriteType,
    PermissionsBitField,
    escapeMarkdown,
    type APIEmbed,
    type GuildChannel,
    type MessageCreateOptions,
    type PartialGuildMember,
    type PartialGuildScheduledEvent,
    type PartialMessage,
} from "discord.js";
import { invokeLog } from "./lib.ts";
import { archiveDurations, audit, auditEntry, channelTypes, eventStatuses, fieldsFor, to } from "./utils.ts";

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
