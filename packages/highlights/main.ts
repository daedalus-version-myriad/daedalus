import { trpc } from "../api/index.js";
import { checkPermissions, getColor, isModuleDisabled, isWrongClient, timestamp, truncate } from "../bot-utils/index.js";
import { ChannelType, Client, Events, GuildMember, MessageType, PermissionFlagsBits, type GuildTextBasedChannel } from "discord.js";
import { stem } from "./lib.js";

const lastSeen = new Map<string, number>();
const lastHighlighted = new Map<string, number>();

export const highlightsHook = (client: Client) =>
    client.on(Events.MessageCreate, async (message) => {
        if (!message.guild) return;
        if (message.author.id === message.client.user.id) return;
        if (await isWrongClient(message.client, message.guild)) return;
        if (await isModuleDisabled(message.guild, "highlights")) return;

        const now = Date.now();
        lastSeen.set(`${message.channel.id}/${message.author.id}`, now);

        let repliedAuthor: string | undefined;

        if (message.type === MessageType.Reply) {
            const id = message.mentions.repliedUser?.id;
            if (!id) return;

            const member = message.guild.members.cache.get(id);

            if (!message.mentions.users.has(id) && (!member || !member.roles.cache.hasAny(...message.mentions.roles.keys()))) repliedAuthor = id;
        }

        const normalized = message.content.split(/\b/).map((x) => [stem(x).join(""), x]);

        const members: { member: GuildMember; reply: boolean; reason?: { found: string; phrase: string } }[] = [];

        for (const entry of await trpc.getGuildHighlights.query(message.guild.id)) {
            const member = message.guild.members.cache.get(entry.user);
            if (!member) continue;
            if (member.id === message.author.id) continue;
            if (await checkPermissions(member, "highlight", message.channel)) continue;

            const key = `${message.channel.id}/${member.id}`;

            if (
                (lastSeen.has(key) && now - lastSeen.get(key)! < (entry.delay ?? 300000)) ||
                (lastHighlighted.has(key) && now - lastHighlighted.get(key)! < (entry.cooldown ?? 300000))
            )
                continue;

            if (entry.blockedUsers?.includes(message.author.id)) continue;
            if (entry.blockedChannels?.includes(message.channel.id)) continue;

            if (message.channel.isThread()) {
                if (!message.channel.parent?.permissionsFor(member).has(PermissionFlagsBits.ViewChannel)) continue;

                if (
                    message.channel.type === ChannelType.PrivateThread &&
                    !message.channel.members.cache.has(member.id) &&
                    !message.channel.parent.permissionsFor(member).has(PermissionFlagsBits.ManageThreads)
                )
                    continue;
            } else if (!(message.channel as GuildTextBasedChannel).permissionsFor(member).has(PermissionFlagsBits.ViewChannel)) continue;

            const reply = !!entry.replies && repliedAuthor === member.id;
            let reason: { found: string; phrase: string } | undefined;

            if (!reply)
                for (const phrase of entry.phrases ?? []) {
                    const list = phrase.split(" ");
                    let found: string[] = [];
                    let index = 0;

                    for (const [stemmed, word] of normalized)
                        if (!stemmed) {
                            if (index > 0) found.push(word);
                        } else if (stemmed === list[index]) {
                            found.push(word);
                            index++;
                            if (index >= list.length) break;
                        } else {
                            index = 0;
                            found = [];

                            if (stemmed === list[index]) {
                                found.push(word);
                                index++;
                                if (index >= list.length) break;
                            }
                        }

                    if (index >= list.length) {
                        reason = { found: found.join(" "), phrase: list.join(" ") };
                        break;
                    }
                }

            if (reply || reason) members.push({ member, reply, reason });
        }

        if (members.length === 0) return;

        const color = await getColor(message.guild);
        const messages: string[] = [];

        for (let x = -5; x < 0; x++) {
            const m = message.channel.messages.cache.at(x);

            if (m) messages.push(`[${timestamp(m.createdTimestamp)}] ${m.author.tag ?? "Unknown User"}: ${truncate(m.content, 1000)}`);
        }

        const context = messages.join("\n");

        for (const { member, reply, reason } of members) {
            const sent = await member
                .send({
                    embeds: [
                        {
                            title: "Highlight Triggered",
                            description: `You were highlighted in ${message.channel} (${
                                reply
                                    ? "replied message without ping"
                                    : reason!.found === reason!.phrase
                                      ? `\`${reason!.phrase}\``
                                      : `\`${reason!.phrase}\` = \`${reason!.found}\``
                            })`,
                            color,
                            fields: [
                                { name: "Context", value: context.substring(-1024) },
                                { name: "Source", value: `[Jump!](${message.url})` },
                            ],
                            url: message.url,
                        },
                    ],
                })
                .catch(() => {});

            if (sent) lastHighlighted.set(`${message.channel.id}/${member.id}`, now);
        }
    });
