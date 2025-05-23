import { GuildMember, Invite, Message, PermissionFlagsBits, escapeMarkdown, type GuildBasedChannel, type PartialMessage } from "discord.js";
import _ from "lodash";
import { code } from "../bot-utils/index.js";
import { englishList } from "../formatting/index.js";
import type { GuildAutomodSettings } from "../types/index.js";

export type Rule = GuildAutomodSettings["rules"][number] & { id: number };

const invitePattern = new RegExp(Invite.InvitesPattern, "g");
const cache = new Map<string, { message: Message; time: number }[]>();

export function skip(message: Message | PartialMessage, rule: Rule, config: GuildAutomodSettings) {
    if (!message.webhookId && message.member && skipMember(message.member, rule, config)) return true;

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

export async function match(rule: Rule, message: Message, multiDeleteTargets: Message[], isEdit: boolean): Promise<[string, string] | undefined> {
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

            const match = message.content.match(pre + _.escapeRegExp(term) + post);
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

        return [`Your message contained more than the allowed uppercase letters.`, `Caps Limit Exceeded (${caps} / ${letters.length}).`];
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
    } else if (type === "emoji-spam") {
        const emojis = message.content.match(/<a?:[^:]+?:\d+>|\p{Extended_Pictographic}/gu);
        if (!emojis) return;

        const { blockAnimatedEmoji, limit } = rule.emojiSpamData;
        const blockedAnimated = blockAnimatedEmoji && emojis.some((x) => x.startsWith("<a"));

        if (!blockedAnimated && emojis.length <= limit) return;

        return [
            `Your message contained ${[emojis.length > limit ? "too many emoji" : [], blockedAnimated ? "animated emoji, which are not allowed" : []]
                .flat()
                .join(" and ")}`,
            `Emoji Limit Exceeded (${[emojis.length > limit ? `${emojis.length} > ${limit}` : [], blockedAnimated ? "blocked animated emoji" : []]
                .flat()
                .join(" and ")}).`,
        ];
    } else if (type === "ratelimit" || type === "attachment-spam" || type === "sticker-spam" || type === "link-spam" || type === "mention-spam") {
        if (isEdit && type !== "link-spam") return;

        const key = `${message.guild!.id}/${message.webhookId ? `wh/${message.webhookId}` : `user/${message.author.id}`}/${rule.id}/${
            message.webhookId ? message.author.username : ""
        }`;

        if (!cache.has(key)) cache.set(key, []);
        else if (isEdit)
            cache.set(
                key,
                cache.get(key)!.filter((m) => m.message.id !== message.id),
            );

        const array = cache.get(key)!;

        const mentions =
            type === "mention-spam" ? message.mentions.users.size + message.mentions.roles.size - (message.mentions.users.has(message.author.id) ? 1 : 0) : 0;

        const object = { message, time: Date.now() };

        let links: RegExpMatchArray | null;

        switch (type) {
            case "ratelimit":
                array.push(object);
                break;
            case "attachment-spam":
                if (message.attachments.size === 0) return;
                for (let x = 0; x < message.attachments.size; x++) array.push(object);
                break;
            case "sticker-spam":
                if (message.stickers.size === 0) return;
                for (let x = 0; x < message.stickers.size; x++) array.push(object);
                break;
            case "link-spam":
                links = message.content.match(/\bhttps?:\/{2,}/g);
                if (!links?.length) return;
                for (let x = 0; x < links.length; x++) array.push(object);
                break;
            case "mention-spam":
                if (mentions === 0) return;
                for (let x = 0; x < mentions; x++) array.push(object);
                break;
        }

        const data = {
            ratelimit: rule.ratelimitData,
            "attachment-spam": rule.attachmentSpamData,
            "sticker-spam": rule.stickerSpamData,
            "link-spam": rule.linkSpamData,
            "mention-spam": rule.mentionSpamData,
        }[type];

        const threshold = "totalLimit" in data ? data.totalLimit : data.threshold;
        const ratelimited = array.length >= threshold && Date.now() - array[array.length - threshold].time <= data.timeInSeconds * 1000;
        const limited = type === "mention-spam" && mentions > rule.mentionSpamData.perMessageLimit;

        const blockedEveryone =
            type === "mention-spam" &&
            rule.mentionSpamData.blockFailedEveryoneOrHere &&
            /@(everyone|here)/.test(message.content) &&
            !message.member?.permissions.has(PermissionFlagsBits.MentionEveryone);

        if (!ratelimited && !limited && !blockedEveryone) return;

        const deleted = new Set<string>();

        if (rule.deleteMessage)
            for (const { message } of array.slice(-threshold)) {
                if (deleted.has(message.id)) break;
                multiDeleteTargets.push(message);
                deleted.add(message.id);
            }

        const messageParts: string[] = [];
        const reportParts: string[] = [];

        const variant = {
            ratelimit: "messages",
            "attachment-spam": "files",
            "sticker-spam": "stickers",
            "link-spam": "links",
            "mention-spam": "mentions",
        }[type];

        if (ratelimited) {
            messageParts.push(`You are sending ${variant} too quickly.`);
            reportParts.push(`Rate Limit Exceeded (${threshold} ${variant} / ${data.timeInSeconds} seconds)`);
        }

        if (limited) {
            messageParts.push(`You sent too many mentions in one message.`);
            reportParts.push(`Mention Limit Exceeded (${mentions} > ${rule.mentionSpamData.perMessageLimit})`);
        }

        if (blockedEveryone) {
            messageParts.push(`You attempted to ping @everyone / @here without permission.`);
            reportParts.push(`Failed @everyone / @here blocked.`);
        }

        return [messageParts.join(" "), reportParts.join(" ")];
    } else if (type === "invite-links") {
        const invites = message.content.match(invitePattern);
        if (!invites) return;

        const blocked: Invite[] = [];

        for (const link of invites)
            try {
                const invite = await message.client.fetchInvite(link);
                if (!invite.guild) continue;

                const { id } = invite.guild;

                if (id === message.guild!.id) continue;
                if (rule.inviteLinksData.allowed.includes(id)) continue;
                if (rule.inviteLinksData.blockUnknown || rule.inviteLinksData.blocked.includes(id)) blocked.push(invite);
            } catch {}

        if (blocked.length === 0) return;

        return [
            `You sent invite links to disallowed servers: ${englishList(blocked.map((x) => `discord.gg/${x.code} (${escapeMarkdown(x.guild!.name)})`))}.`,
            `Blocked Invites: ${blocked.map((x) => `\`${x.code}\` (${escapeMarkdown(x.guild!.name)} \`${x.guild!.id}\`)`).join(", ")}.`,
        ];
    } else if (type === "link-blocklist") {
        const blocked = new Set<string>();

        for (const pattern of rule.linkBlocklistData.websites)
            if (message.content.match(new RegExp(`\\bhttps?:\/\/[^/\\s]*${_.escapeRegExp(pattern)}(${pattern.endsWith("/") ? "" : "/"}\\S*)*?`)))
                blocked.add(pattern);

        if (blocked.size === 0) return;

        const links = [...blocked];

        return [`You sent blocked links: ${englishList(links)}`, `Blocked Links: ${links.join(", ")}`];
    }
}
