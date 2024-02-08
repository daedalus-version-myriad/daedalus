import { code } from "@daedalus/bot-utils";
import { englishList } from "@daedalus/formatting";
import type { GuildAutomodSettings } from "@daedalus/types";
import { GuildMember, Invite, Message, type GuildBasedChannel, type PartialMessage } from "discord.js";
import { escapeRegExp } from "lodash";

export type Rule = GuildAutomodSettings["rules"][number];

const invitePattern = new RegExp(Invite.InvitesPattern, "g");
const cache = new Map<string, Message[]>();

export function skip(message: Message | PartialMessage, rule: Rule, config: GuildAutomodSettings) {
    if (!message.member || skipMember(message.member, rule, config)) return true;

    if (message.channel.isDMBased()) return true;
    let channel: GuildBasedChannel | null = message.channel;

    do {
        if (rule.watchedChannels.includes(channel.id)) return false;
        if (rule.ignoredChannels.includes(channel.id)) return true;
        if (!rule.disregardDefaultIgnoredChannels && config.ignoredChannels.includes(channel.id)) return true;
    } while ((channel = channel!.parent));

    return rule.onlyWatchEnabledChannels;
}

export function skipMember(member: GuildMember, rule: Rule, config: GuildAutomodSettings) {
    if (member.roles.cache.hasAny(...rule.watchedRoles)) return false;
    if (member.roles.cache.hasAny(...rule.ignoredRoles)) return true;
    if (rule.disregardDefaultIgnoredRoles) return false;
    if (member.roles.cache.hasAny(...config.ignoredRoles)) return true;

    return rule.onlyWatchEnabledRoles;
}

export async function match(rule: Rule, message: Message, multiDeleteTargets: Message[]): Promise<[string, string] | undefined> {
    const { type } = rule;

    if (type === "blocked-terms") {
        const { terms } = rule.blockedTermsData;
        const matches: string[] = [];

        for (let term of terms) {
            let pre = "\\b.*";
            let post = ".*\\b";

            if (term.startsWith("*")) term = term.slice(1);
            else pre = "\\b";

            if (term.endsWith("*")) term = term.slice(0, -1);
            else post = "\\b";

            const match = message.content.match(pre + escapeRegExp(term) + post);
            if (match) matches.push(match[0]);
        }

        if (matches.length === 0) return;

        const list = englishList(matches.map((x) => code(x)));

        return [
            `Your message contained the following banned word${matches.length === 1 ? "" : "s"}: ${list}`,
            `Blocked Term${matches.length === 1 ? "" : "s"}: ${list}`,
        ];
    } else if (type === "blocked-stickers") {
        const matches = message.stickers.filter((x) => rule.blockedStickersData.ids.includes(x.id));
        if (matches.size === 0) return;

        const list = englishList(matches.map((x) => `${x.name} (\`${x.id}\`)`));

        return [
            `Your message contained the following banned sticker${matches.size === 1 ? "" : "s"}: ${list}`,
            `Blocked Sticker${matches.size === 1 ? "" : "s"}: ${list}`,
        ];
    } else if (type === "caps-spam") {
        const letters = message.content.split("").filter((x) => x.toLowerCase() !== x.toUpperCase());
        const caps = letters.filter((x) => x === x.toUpperCase()).length;

        if (caps <= rule.capsSpamData.limit || caps * 100 < rule.capsSpamData.ratioLimit * letters.length) return;

        return [`Your message contained more than the allowed uppercase letters.`, `Caps Limit Exceeded (${caps}/ ${letters.length}).`];
    } else if (type === "newline-spam") {
        const lines = message.content.split("\n").map((x) => x.trim().length);

        let maxConsecutive = 0,
            consecutive = 0;

        for (const line of lines) {
            consecutive++;
            if (consecutive > maxConsecutive) maxConsecutive = consecutive;
            if (line > 0) consecutive = 0;
        }

        const { consecutiveLimit, totalLimit } = rule.newlineSpamData;
        if (maxConsecutive <= consecutiveLimit && lines.length - 1 <= totalLimit) return;

        return [
            `Your message contained ${[maxConsecutive > consecutiveLimit ? "more than the allowed consecutive newlines" : [], lines.length - 1 > totalLimit ? "more than the allowed newlines" : []].flat().join(" and ")}.`,
            `Newline Limit Exceeded: (${maxConsecutive} consecutive, ${lines.length - 1} total)`,
        ];
    } else if (type === "repeated-characters") {
        let maxConsecutive = 0,
            consecutive = 0;

        let last: string | null = null;

        for (const char of message.content) {
            if (last === char) consecutive++;
            else {
                consecutive = 1;
                last = char;
            }

            if (consecutive > maxConsecutive) maxConsecutive = consecutive;
        }

        const { consecutiveLimit } = rule.repeatedCharactersData;
        if (maxConsecutive <= consecutiveLimit) return;

        return [
            `Your message contained more than the allowed number of consecutive repeated characters.`,
            `Repeated Character Limit Exceeded (${maxConsecutive} > ${consecutiveLimit}).`,
        ];
    } else if (type === "length-limit") {
        const { limit } = rule.lengthLimitData;
        if (message.content.length <= limit) return;

        return [`Your message was too long (${message.content.length} > ${limit}).`, `Length Limit Exceeded (${message.content.length} > ${limit}).`];
    }
}
