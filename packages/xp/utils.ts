import { trpc } from "@daedalus/api";
import { fetchAndSendMessage, getColor, to } from "@daedalus/bot-utils";
import { secrets } from "@daedalus/config";
import { logError } from "@daedalus/log-interface";
import type { GuildXpSettings } from "@daedalus/types";
import { escapeMarkdown, type Channel, type GuildMember } from "discord.js";

export function xpToLevel(xp: number, floor: boolean = true) {
    if (xp === 0) return 0;

    const u = Math.cbrt(Math.sqrt(11664 * xp ** 2 + 874800 * xp - 621075) - 108 * xp - 4050);
    const level = -u / 2 / Math.cbrt(45) - (61 * Math.cbrt(5 / 3)) / 2 / u - 9 / 2;
    return floor ? Math.floor(level) : level;
}

export function levelToXp(level: number) {
    return (5 / 3) * level ** 3 + (135 / 6) * level ** 2 + (455 * level) / 6;
}

function scale(channel: Channel, settings: GuildXpSettings) {
    if (channel.isDMBased()) return 0;
    if (settings === null) return 1;

    let current: Channel | null = channel;

    do {
        const item = settings.bonusChannels.find((x) => x.channel === current!.id);
        if (item && item.multiplier !== null) return item.multiplier;
    } while ((current = current.parent));

    return 1;
}

export async function addXp(channel: Channel, member: GuildMember, text = 0, voice = 0, settings: GuildXpSettings) {
    text *= Math.random() * 10 + 15;
    voice *= Math.random() * 10 + 15;

    try {
        settings ??= await trpc.getXpConfig.query(member.guild.id);

        const channelRatio = scale(channel, settings);
        text *= channelRatio;
        voice *= channelRatio;

        const roleRatio = Math.max(
            1,
            ...(settings.bonusRoles
                .filter((x) => x.role && member.roles.cache.has(x.role))
                .map((x) => x.multiplier)
                .filter((x) => x !== null) as number[]),
        );

        text *= roleRatio;
        voice *= roleRatio;

        const announcement = settings.announceLevelUp ? (settings.announceInChannel ? channel.id : settings.announceChannel) : null;

        if (settings.rewards.length > 0 || announcement) {
            const { total: before } = await trpc.getXpAmount.query({ guild: member.guild.id, user: member.id });
            const levelBefore = { text: xpToLevel(before.text), voice: xpToLevel(before.voice) };
            const levelAfter = { text: xpToLevel(before.text + text), voice: xpToLevel(before.voice + voice) };

            if (announcement)
                for (const key of ["text", "voice"] as const)
                    if (levelAfter[key] > levelBefore[key])
                        await fetchAndSendMessage(
                            member.guild,
                            announcement,
                            "XP",
                            "announcement",
                            {
                                content: `${member}`,
                                embeds: [
                                    {
                                        title: "Congratulations!",
                                        description: `You have leveled up from ${key} level ${levelBefore[key]} to ${levelAfter[key]}!`,
                                        color: await getColor(member.guild),
                                        image: { url: settings.announcementBackground || secrets.ASSETS.XP_LEVELUP_IMAGE },
                                    },
                                ],
                                allowedMentions: { users: [member.id] },
                            },
                            `The XP level-up announcement for ${member} (${key} level ${levelBefore[key]} ${to} ${levelAfter[key]}) could not be sent.`,
                        );

            const roles = new Set(member.roles.cache.keys());
            const removeable: string[] = [];

            let dmRole: string | null = null;
            const threshold = { text: 0, voice: 0 };

            for (const reward of settings.rewards) {
                if (reward.role === null) continue;

                let award = false;

                for (const key of ["text", "voice"] as const)
                    if (reward[key] !== null && reward[key]! >= threshold[key] && levelAfter[key] >= reward[key]!) {
                        award = true;
                        threshold[key] = reward[key]!;
                    }

                if (!award) continue;

                roles.add(reward.role);

                while (removeable.length > 0) {
                    if (dmRole === removeable[0]) dmRole = null;
                    roles.delete(removeable.shift()!);
                }

                if (reward.removeOnHigher) removeable.push(reward.role);
                if (reward.dmOnReward && (!reward.text || levelBefore.text < reward.text) && (!reward.voice || levelBefore.voice < reward.voice))
                    dmRole = reward.role;
            }

            try {
                await member.roles.set([...roles]);
            } catch {
                logError(
                    member.guild.id,
                    "Rewarding XP Roles",
                    `One or more of the following roles could not be set for ${member}: ${[...roles].map((x) => `<@&${x}>`).join(" ")}`,
                );
            }

            if (dmRole)
                await member
                    .send({
                        embeds: [
                            {
                                title: "Level Up!",
                                description: `Congratulations! You have reached ${(["text", "voice"] as const)
                                    .filter((key) => levelBefore[key] < levelAfter[key])
                                    .map((key) => `${key} level ${levelAfter[key]}`)
                                    .join(
                                        " & ",
                                    )} in **${escapeMarkdown(member.guild.name)}**! You have been rewarded with the **${member.guild.roles.cache.get(dmRole)?.name ?? "(Unknown Role)"}** role.`,
                                color: await getColor(member.guild),
                                thumbnail: { url: member.displayAvatarURL({ size: 256 }) },
                                image: ((url) => (url === null ? undefined : { url }))(member.guild.bannerURL({ size: 1024 })),
                            },
                        ],
                    })
                    .catch(() => null);
        }
    } catch (error) {
        console.error(error);
    }

    await trpc.increaseXp.mutate({ guild: member.guild.id, user: member.id, text, voice });
}
