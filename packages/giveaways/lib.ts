import { trpc } from "../api/index.js";
import type { GuildGiveawaySettings } from "../types/index.js";
import type { Guild, GuildMember } from "discord.js";

export async function countEntries(giveaway: GuildGiveawaySettings["giveaways"][number], member: GuildMember) {
    if (
        !hasRoles(giveaway.bypassRolesAll, giveaway.bypassRoles, member) &&
        (!hasRoles(giveaway.requiredRolesAll, giveaway.requiredRoles, member, true) || hasRoles(giveaway.blockedRolesAll, giveaway.blockedRoles, member))
    )
        return 0;

    let count = 1;

    for (const { role, weight } of giveaway.weights)
        if (role && member.roles.cache.has(role)) count = giveaway.stackWeights ? count + weight : Math.max(count, weight);

    return count;
}

function hasRoles(all: boolean, roles: string[], member: GuildMember, defaultValue: boolean = false) {
    return roles.length === 0 ? defaultValue : all ? member.roles.cache.hasAll(...roles) : member.roles.cache.hasAny(...roles);
}

export async function draw(guild: Guild, giveaway: GuildGiveawaySettings["giveaways"][number], winners?: number) {
    winners ??= giveaway.winners;

    const entries = await trpc.getGiveawayEntries.query({ guild: guild.id, id: giveaway.id });

    const tickets: Record<string, { count: number; display: string }> = {};
    let total = 0;

    for (const id of entries) {
        const member = await guild.members.fetch(id).catch(() => {});
        if (!member) continue;

        const count = await countEntries(giveaway, member);
        if (count === 0) continue;

        tickets[id] = { count, display: `${member} (${member.user.tag})` };
        total += count;
    }

    const outcome: string[] = [];

    for (let drawn = 0; total > 0 && drawn < winners; drawn++) {
        let key = Math.floor(Math.random() * total);

        for (const [id, { count, display }] of Object.entries(tickets)) {
            if (key < count) {
                outcome.push(display);

                if (giveaway.allowRepeatWinners) {
                    total--;
                    tickets[id].count--;
                } else {
                    total -= tickets[id].count;
                    delete tickets[id];
                }

                break;
            }

            key -= count;
        }
    }

    return outcome;
}
