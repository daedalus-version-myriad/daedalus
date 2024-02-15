import { trpc } from "@daedalus/api";
import { expand, isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { englishList } from "@daedalus/formatting";
import { audit } from "@daedalus/logging";
import type { GuildNukeguardSettings } from "@daedalus/types";
import { AuditLogEvent, Client, Colors, Events, GuildChannel, IntentsBitField, Partials, type APIRole, type Guild, type User } from "discord.js";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.GuildMembers | Intents.GuildModeration | Intents.GuildEmojisAndStickers,
            partials: [Partials.Channel, Partials.GuildMember],
        }),
    postprocess: (client) =>
        client
            .on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
                if (!entry.executorId) return;

                const user = await client.users.fetch(entry.executorId).catch(() => {});
                if (!user) return;

                // if (user.id === guild.ownerId) return;
                if (user.id === guild.client.user.id) return;

                if (
                    ![
                        AuditLogEvent.RoleDelete,
                        AuditLogEvent.EmojiDelete,
                        AuditLogEvent.StickerDelete,
                        AuditLogEvent.WebhookCreate,
                        AuditLogEvent.WebhookDelete,
                        AuditLogEvent.MemberBanAdd,
                        AuditLogEvent.MemberKick,
                        AuditLogEvent.MemberRoleUpdate,
                    ].includes(entry.action)
                )
                    return;

                if (await isWrongClient(client, guild)) return;
                if (await isModuleDisabled(guild, "nukeguard")) return;

                const config = await trpc.getNukeguardConfig.query(guild.id);

                try {
                    const member = await guild.members.fetch(user);
                    if (member.roles.cache.hasAny(...config.exemptedRoles)) return;
                } catch {
                    return;
                }

                let type: string | undefined;
                let description: string;
                let alert: string;

                // TODO: add soundboard deletion detection

                if (entry.action === AuditLogEvent.RoleDelete) {
                    if (config.ignoredRoles.includes(entry.targetId!) || (!config.watchRolesByDefault && !config.watchedRoles.includes(entry.targetId!)))
                        return;
                    type = "role";
                } else if (entry.action === AuditLogEvent.EmojiDelete) {
                    type = "emoji";
                } else if (entry.action === AuditLogEvent.StickerDelete) {
                    type = "sticker";
                } else if (entry.action === AuditLogEvent.WebhookCreate) {
                    if (!config.preventWebhookCreation) return;

                    const webhooks = await guild.fetchWebhooks();
                    const webhook = webhooks.find((x) => x.id === entry.targetId);
                    if (!webhook) return;

                    await webhook.delete("Nukeguard Action");

                    let warned = true;

                    await user
                        .send({
                            embeds: [
                                {
                                    title: "Nukeguard Warning",
                                    description:
                                        "Your newly created webhook was deleted by Daedalus Nukeguard. If you need a new webhook, please talk to server administration or the server owner.",
                                    color: Colors.Red,
                                },
                            ],
                        })
                        .catch(() => (warned = false));

                    const channel = config.adminChannel === null ? null : await guild.channels.fetch(config.adminChannel!).catch(() => {});
                    if (!channel?.isTextBased()) return;

                    await channel
                        .send({
                            embeds: [
                                {
                                    title: "Nukeguard Alert (Webhook Deleted)",
                                    description: `<@${entry.executorId}> tried creating a webhook, which was removed by nukeguard, ${warned ? "and they were warned" : "but they could not be warned"}.`,
                                    color: Colors.Gold,
                                },
                            ],
                            allowedMentions: { parse: ["everyone", "roles"] },
                        })
                        .catch(() => console.error);

                    return;
                } else if (entry.action === AuditLogEvent.WebhookDelete) {
                    if (!config.watchWebhookDeletion) return;
                    description = "deleted a webhook, which is not permitted by nukeguard.";
                } else if (entry.action === AuditLogEvent.MemberBanAdd) {
                    return void (await track(guild, user, config));
                } else if (entry.action === AuditLogEvent.MemberKick) {
                    if (!config.ratelimitKicking) return;
                    return void (await track(guild, user, config));
                } else if (entry.action === AuditLogEvent.MemberRoleUpdate) {
                    const roles = entry.changes
                        .filter((x) => x.key === "$add")
                        .flatMap((x) =>
                            (x.new as APIRole[])
                                .map((k) => k.id)
                                .filter((x) =>
                                    config.restrictRolesByDefault
                                        ? !config.restrictRolesAllowedRoles.includes(x)
                                        : config.restrictRolesBlockedRoles.includes(x),
                                ),
                        );

                    if (roles.length === 0) return;

                    const names = englishList(roles.map((x) => guild.roles.cache.get(x)?.name ?? "(unknown role)"));

                    try {
                        const member = await guild.members.fetch(entry.targetId!);
                        await member.roles.remove(roles);
                    } catch {}

                    if (config.restrictRolesLenient) {
                        const now = Date.now();

                        if (!watchlist.has(user.id) || now - watchlist.get(user.id)! > 360000) {
                            watchlist.set(user.id, now);

                            return void (await user
                                .send({
                                    embeds: [
                                        {
                                            title: "Nukeguard Warning",
                                            description: `You assigned ${roles.length === 1 ? "a role that is" : "roles that are"} forbidden by the nukeguard configuration (${names}). Violating this rule again within 1 hour will result in further actions. Speak to a server administrator of the server owner if you believe this is a mistake.`,
                                            color: Colors.Gold,
                                        },
                                    ],
                                })
                                .catch(() => {}));
                        }
                    }

                    description = `assigned ${roles.length === 1 ? "a role that is" : "roles that are"} forbidden by the nukeguard configuration (${names}).`;
                    alert = `${expand(user)} assigned ${roles.length === 1 ? "a blocked role" : "blocked roles"}: ${englishList(roles.map((x) => expand(guild.roles.cache.get(x), "(unknown role)")))}`;
                }

                if (type) description ??= `deleted a protected ${type} (\`${entry.targetId}\`)`;
                alert ??= `${expand(user)} ${description!}`;

                await quarantine(guild, user, config, `You ${description!}`, alert!);
            })
            .on(Events.ChannelDelete, async (channel) => {
                if (channel.isDMBased()) return;

                if (await isWrongClient(client, channel.guild)) return;
                if (await isModuleDisabled(channel.guild, "nukeguard")) return;

                const user = await audit(channel.guild, AuditLogEvent.ChannelDelete, channel);
                if (!user) return;

                const config = await trpc.getNukeguardConfig.query(channel.guild.id);

                let current: GuildChannel | null = channel;

                do {
                    if (config.watchedChannels.includes(current.id)) break;
                    if (config.ignoredChannels.includes(current.id)) return;
                } while ((current = current.parent));

                if (!current && !config.watchChannelsByDefault) return;

                await quarantine(
                    channel.guild,
                    user,
                    config,
                    `You deleted a protected channel (\`${channel.id}\`)`,
                    `${expand(user)} deleted a protected channel (\`${channel.id}\`)`,
                );
            }),
});

const bans = new Map<string, number[]>();
const watchlist = new Map<string, number>();

async function track(guild: Guild, user: User, config: GuildNukeguardSettings) {
    if (user.bot || !config.enableRatelimit) return;

    if (!bans.has(user.id)) bans.set(user.id, []);

    const now = Date.now();
    const list = bans.get(user.id)!;
    list.push(now);

    if (config.ratelimitTime === null || config.ratelimitThreshold === null) return;
    const amount = list.filter((x) => x > now - config.ratelimitTime! * 1000).length;

    if (amount === config.ratelimitThreshold)
        return void (await user
            .send({
                embeds: [
                    {
                        title: "Nukeguard Warning",
                        description:
                            "You are approaching the mod action ratelimit threshold. Please slow down to avoid further actions. Speak to a server administrator or the server owner if you believe this is a mistake.",
                        color: Colors.Gold,
                    },
                ],
            })
            .catch(() => {}));

    if (amount > config.ratelimitThreshold)
        await quarantine(guild, user, config, `You have hit the nukeguard mod action ratelimit threshold`, `${expand(user)} hit the kick/ban ratelimit`);
}

async function quarantine(guild: Guild, user: User, config: GuildNukeguardSettings, message: string, alert: string) {
    let banned = true;

    try {
        const member = await guild.members.fetch(user);
        if (member.roles.cache.hasAny(...config.exemptedRoles)) return;
    } catch {}

    if (guild.members.cache.get(user.id)?.bannable)
        await user
            .send({
                embeds: [
                    {
                        title: "Nukeguard Action",
                        description: `${message} You have been banned and administrators have been alerted of this action; please wait for their review.`,
                        color: Colors.Red,
                    },
                ],
            })
            .catch(() => {});

    await guild.bans.create(user, { reason: "Nukeguard Action" }).catch(() => (banned = false));

    const channel = config.adminChannel === null ? null : await guild.channels.fetch(config.adminChannel!).catch(() => {});
    if (!channel?.isTextBased()) return;

    await channel
        .send({
            content: `${config.pingHere ? "@here " : ""}${config.pingRoles
                .map((x) => guild.roles.cache.get(x))
                .filter((x) => x)
                .map((x) => `${x}`)
                .join(" ")}`,
            embeds: [
                {
                    title: "Nukeguard Report",
                    description: `${alert} ${banned ? "and was" : "but could not be"} quarantined (temporarily banned).`,
                    color: Colors.Gold,
                },
            ],
            allowedMentions: { parse: ["everyone", "roles"] },
        })
        .catch(() => console.error);
}

setInterval(() => {
    const filter = Date.now() - 3600000;

    for (const [key, list] of bans) {
        bans.set(
            key,
            list.filter((x) => x > filter),
        );

        if (bans.get(key)!.length === 0) bans.delete(key);
    }
}, 600000);
