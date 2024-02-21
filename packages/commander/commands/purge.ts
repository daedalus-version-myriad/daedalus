import { trpc } from "../../api/index.js";
import { confirm, defer, obtainLimit, template, type Commands } from "../../bot-utils/index.js";
import { secrets } from "../../config/index.js";
import { PremiumTier, premiumBenefits } from "../../data/index.js";
import { parseMessageURL } from "../../global-utils/index.js";
import { stopButton } from "../../interactions/index.js";
import type { SlashUtil } from "../../argentium/src/slash-util";
import { Colors, ComponentType, type ChatInputCommandInteraction, type Message } from "discord.js";

export default (x: Commands) =>
    x
        .slash((x) =>
            x
                .key("purge last")
                .description("purge messages that pass an (optional) filter of the last N messages")
                .numberOption("count", "the number of messages to search", {
                    minimum: 1,
                    maximum: premiumBenefits[PremiumTier.PREMIUM].purgeAtOnceLimit,
                    required: true,
                })
                .use(addPurgeFilters)
                .fn(defer(true))
                .fn(async ({ _, count, ...rest }) => {
                    const limit = (await obtainLimit(_.guild!.id, "purgeAtOnceLimit")) as number;

                    if (count > limit)
                        throw `You can only scan ${limit} messages at once. Upgrade to [premium](${secrets.DOMAIN}/premium) to unlock up to ${
                            premiumBenefits[PremiumTier.PREMIUM].purgeAtOnceLimit
                        }.`;

                    const messages: Message[] = [];

                    while (count > 0) {
                        const block = await _.channel!.messages.fetch({ limit: Math.min(count, 100), before: messages[messages.length - 1]?.id });
                        if (block.size === 0) break;

                        messages.push(...block.toJSON());
                        count -= 100;
                    }

                    return await purge(_, messages, rest);
                }),
        )
        .slash((x) =>
            x
                .key("purge between")
                .description("purge messages that pass an (optional) filter between a start and end message")
                .stringOption("start", "the URL of the initial message", { required: true })
                .stringOption("end", "the URL of the end message (default: ends at the bottom of the channel)")
                .use(addPurgeFilters)
                .fn(defer(true))
                .fn(async ({ _, start: _start, end: _end, ...rest }) => {
                    const limit = (await obtainLimit(_.guild!.id, "purgeAtOnceLimit")) as number;

                    let end: string | undefined;

                    const [start_gid, start_cid, start_mid] = parseMessageURL(_start);

                    if (start_gid !== _.guild!.id) throw "The start message must be in this server.";
                    if (start_cid !== _.channel!.id) throw "The start message must be in this channel.";

                    const start = start_mid;

                    if (_end) {
                        const [end_gid, end_cid, end_mid] = parseMessageURL(_end);

                        if (end_gid !== _.guild!.id) throw "The end message must be in this server.";
                        if (end_cid !== _.channel!.id) throw "The end message must be in this channel.";

                        end = end_mid;

                        if (BigInt(start) > BigInt(end)) throw "The start message must be before the end message.";
                    }

                    const position = BigInt(start);
                    const messages: Message[] = [];

                    if (end)
                        try {
                            messages.push(await _.channel!.messages.fetch(end));
                        } catch {}

                    let go = true;

                    while (go) {
                        if (messages.length >= limit)
                            throw `You can only scan ${limit} messages at once.${
                                limit === premiumBenefits[PremiumTier.PREMIUM].purgeAtOnceLimit
                                    ? ""
                                    : ` Upgrade to [premium](${secrets.DOMAIN}/premium) to unlock up to ${
                                          premiumBenefits[PremiumTier.PREMIUM].purgeAtOnceLimit
                                      }.`
                            }`;

                        const block = await _.channel!.messages.fetch({ limit: 100, before: messages[messages.length - 1]?.id ?? end });

                        for (const message of block.toJSON()) {
                            if (message.id <= start) go = false;

                            if (BigInt(message.id) < position) break;
                            else messages.push(message);
                        }
                    }

                    return await purge(_, messages, rest);
                }),
        );

const addPurgeFilters = <T>(x: SlashUtil<T>) =>
    x
        .numberOption("types", "the types of messages to delete (default: all)", { choices: { 1: "Human Accounts", 2: "Bot Accounts", 3: "All" } })
        .stringOption("match", "only delete messages containing the specified substring (default: matches all)")
        .booleanOption("case-sensitive", "if true, the match must be case-sensitive (default: false) (no effect if `match` is not set)");

async function purge(
    _: ChatInputCommandInteraction,
    messages: Message[],
    { types, match, "case-sensitive": caseSensitive }: { types: 1 | 2 | 3 | null; match: string | null; "case-sensitive": boolean | null },
) {
    if (_.channel!.isDMBased()) throw "This command can only be called in a guild.";

    if (types === 1) messages = messages.filter((x) => !x.author.bot);
    if (types === 2) messages = messages.filter((x) => x.author.bot);

    if (match)
        if (caseSensitive) messages = messages.filter((x) => x.content.indexOf(match!) !== -1);
        else {
            match = match.toLowerCase();
            messages = messages.filter((x) => x.content.toLowerCase().indexOf(match!) !== -1);
        }

    if (messages.length === 0) throw "Your query matched no messages, so no action was taken.";

    const amount = messages.length;

    const response = await confirm(
        _,
        {
            embeds: [
                {
                    title: `Confirm purging ${amount} message${amount === 1 ? "" : "s"}`,
                    color: Colors.DarkVividPink,
                },
            ],
        },
        300000,
    );

    if (!response) return;

    await response.update({
        ...template.progress("Purging in progress. Please be patient."),
        components: [{ type: ComponentType.ActionRow, components: [stopButton(response.user)] }],
    });

    let purged = 0;

    while (messages.length > 0) {
        const batch = [];
        const now = Date.now();

        for (let x = 0; x < 100; x++)
            if (messages.length === 0) break;
            else if (now - messages[0].createdTimestamp < 1209590000) batch.push(messages.shift()!);
            else break;

        if (batch.length === 0) {
            for (const message of messages) {
                if (await trpc.isHalted.query(response.message.id)) {
                    await response.editReply(template.info(`Purging was halted with ${purged} message${purged === 1 ? "" : "s"} already purged.`));
                    return;
                }

                try {
                    await message.delete();
                    purged++;
                } catch {}
            }

            break;
        }

        if (await trpc.isHalted.query(response.message.id)) {
            await response.editReply(template.info(`Purging was halted with ${purged} message${purged === 1 ? "" : "s"} already purged.`));
            return;
        }

        try {
            await _.channel!.bulkDelete(batch);
            purged += batch.length;
        } catch {}
    }

    await response.editReply(template.success(`Purged ${purged} message${purged === 1 ? "" : "s"}.`));
}
