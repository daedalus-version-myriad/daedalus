import { trpc } from "@daedalus/api";
import { SpoilerLevel, copyMedia, getColor, isModuleDisabled, isWrongClient, mdash } from "@daedalus/bot-utils";
import type { GuildStarboardSettings } from "@daedalus/types";
import { Client, Events, Message, type APIEmbed, type Channel, type GuildBasedChannel, type PartialMessage } from "discord.js";

export const starboardHook = (client: Client) =>
    client
        .on(Events.MessageReactionAdd, async (reaction) => await checkStars(reaction.message))
        .on(Events.MessageReactionRemove, async (reaction) => await checkStars(reaction.message))
        .on(Events.MessageReactionRemoveEmoji, async (reaction) => await checkStars(reaction.message))
        .on(Events.MessageReactionRemoveAll, checkStars)
        .on(Events.MessageDelete, async (message) => await checkDelete([message]))
        .on(Events.MessageBulkDelete, async (messages) => await checkDelete(messages.toJSON()));

const stars = new Set<string>();

async function checkStars(input: Message | PartialMessage) {
    if (!input.guild) return;
    if (await isWrongClient(input.client, input.guild)) return;
    if (await isModuleDisabled(input.guild, "starboard")) return;

    try {
        const message = (await input.fetch()) as Message<true>;
        const config = await trpc.getStarboardConfig.query(message.guild.id);
        if (!config.reaction) return;

        const starboard = await getStarboard(config, message.channel);
        if (!starboard) return;

        const rxn = message.reactions.cache.get(config.reaction);
        const count = rxn?.count ?? 0;
        const target = await getStarlink(starboard.target, message.id);

        if (count < starboard.threshold) {
            stars.delete(message.id);
            await target?.delete().catch(() => null);
            await trpc.purgeStarlink.mutate(message.id);
        } else {
            const content = `${rxn!.emoji} **${count}** ${message.channel}`;

            if (target) await target.edit({ content });
            else {
                if (isNSFW(message.channel) && !isNSFW(starboard.target)) return;
                if (stars.has(message.id)) return void setTimeout(() => checkStars(message), 1000);
                stars.add(message.id);

                const attachments = await copyMedia(message, SpoilerLevel.KEEP);

                const single =
                    attachments.length === 1 &&
                    !attachments[0].name?.startsWith("SPOILER_") &&
                    ["png", "jpg"].includes((attachments[0].name ?? "").split(".").at(-1)!);

                let embeds: APIEmbed[] = [
                    {
                        description: message.content || undefined,
                        color: await getColor(message.guild),
                        fields: [{ name: "Source", value: `[Jump!](${message.url})` }],
                        author: { name: message.author.tag, icon_url: (message.member ?? message.author).displayAvatarURL({ size: 64 }) },
                        footer: { text: message.id },
                        image: single ? { url: attachments[0].attachment as string } : undefined,
                    },
                ];

                let files = [];

                if (!message.embeds.some((embed) => embed.data.type === "rich")) files = single ? [] : attachments;
                else {
                    embeds[0].image = undefined;
                    files = attachments;
                    embeds = [...message.embeds.map((e) => e.toJSON()).slice(0, 9), embeds[0]];
                }

                let link: Message;

                try {
                    link = await starboard.target.send({ content, embeds, files });
                } catch {
                    link = await starboard.target.send({
                        content,
                        embeds: [
                            ...embeds.slice(0, -1),
                            {
                                ...embeds.at(-1)!,
                                footer: { text: `${embeds.at(-1)!.footer!.text} ${mdash} files could not be uploaded; please jump to the original message` },
                            },
                        ],
                    });
                }

                await trpc.addStarlink.mutate({ source: message.id, target: link.id });
            }
        }
    } finally {
        stars.delete(input.id);
    }
}

async function checkDelete(messages: (Message | PartialMessage)[]) {
    const channel = messages[0].channel;
    if (!channel || channel.isDMBased()) return;

    const guild = channel.guild;

    const config = await trpc.getStarboardConfig.query(guild.id);
    if (!config) return;

    const starboard = await getStarboard(config, channel);
    if (!starboard) return;

    const targets = await trpc.getStarlinks.query(messages.map((x) => x.id));
    if (targets.length === 0) return;

    try {
        await starboard.target.bulkDelete(targets);
    } catch {
        for (const target of targets) await starboard.target.messages.delete(target).catch(() => null);
    }

    await trpc.purgeStarlinksByTargets.mutate(targets);
}

async function getStarboard(config: GuildStarboardSettings, channel: Channel) {
    if (channel.isDMBased()) return;

    try {
        let target: GuildBasedChannel | null = null;
        let threshold: number | null = null;
        let current: GuildBasedChannel | null = channel;

        do {
            const override = config.overrides.find((x) => x.channel === current!.id);
            if (!override) continue;
            if (!override.enabled) return;
            if (!target && override.target) target = await channel.guild.channels.fetch(override.target).catch(() => null);
            if (!threshold && override.threshold) threshold = override.threshold;
        } while ((current = current.parent));

        if (!target)
            if (config.channel) target = await channel.guild.channels.fetch(config.channel).catch(() => null);
            else return;

        threshold ??= config.threshold;

        if (target?.isTextBased()) return { target, threshold };
    } catch {}
}

async function getStarlink(channel: Channel, message: string) {
    if (!channel.isTextBased()) return null;

    const target = await trpc.getStarlink.query(message);
    if (!target) return null;

    return await channel.messages.fetch(target).catch(() => null);
}

function isNSFW(channel: Channel) {
    if ("nsfw" in channel) return channel.nsfw;
    if ("parent" in channel) return channel.parent?.nsfw ?? false;
    return false;
}
