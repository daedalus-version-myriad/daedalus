import { Colors, ComponentType, type ChatInputCommandInteraction } from "discord.js";
import { trpc } from "../../api/index.js";
import type { SlashUtil } from "../../argentium/src/slash-util.js";
import { checkPunishment, confirm, enforcePermissions, formatIdList, mdash, template, type Commands } from "../../bot-utils/index.js";
import { DurationStyle, formatDuration, parseDuration } from "../../global-utils/index.js";
import { stopButton } from "../../interactions/index.js";

export default (x: Commands) =>
    x
        .slash((x) =>
            x
                .key("massban list")
                .description("ban many users at once by pasting the list of IDs into the command directly")
                .stringOption("users", "the list of user IDs", { required: true })
                .use(addReasonAndPurge)
                .fn(({ _, users, reason, purge }) => massban(_, users, reason, purge)),
        )
        .slash((x) =>
            x
                .key("massban url")
                .description("ban many users at once from a URL (accepts raw text files)")
                .stringOption("url", "the URL pointing to the file of user IDs", { required: true })
                .use(addReasonAndPurge)
                .fn(({ _, url, reason, purge }) => massbanURL(_, url, reason, purge)),
        )
        .slash((x) =>
            x
                .key("massban file")
                .description("ban many users at once from a file upload")
                .fileOption("file", "the file of user IDs", { required: true })
                .use(addReasonAndPurge)
                .fn(({ _, file, reason, purge }) => massbanURL(_, file.url, reason, purge)),
        );

const addReasonAndPurge = <T>(x: SlashUtil<T>) =>
    x
        .stringOption("reason", "the reason for banning (logged, but not sent to the users)", { maxLength: 512 })
        .stringOption("purge", "the duration of chat history to purge from all banned users (default: 0, max: 7 days)");

async function massbanURL(_: ChatInputCommandInteraction, url: string, reason: string | null, _purge: string | null) {
    if (!_.guild) throw "This command can only be run in a guild.";

    const response = await fetch(url).catch(() => {
        throw "Invalid URL.";
    });

    if (!response.ok) throw `The URL could not be fetched (status code \`${response.status} ${mdash} ${response.statusText}\`).`;

    return await massban(_, (await response.text()).trim(), reason, _purge);
}

async function massban(_: ChatInputCommandInteraction, idlist: string, reason: string | null, _purge: string | null) {
    if (!_.guild) throw "This command can only be run in a guild.";

    const purge = _purge ? parseDuration(_purge) : 0;
    if (purge > 604800000) throw "Purge duration cannot exceed 7 days.";

    if (!idlist.match(/^\d+([,\s]+\d+)*$/)) throw "Invalid format; expected a whitespace/comma-separated list of user IDs (17-20 digit numbers).";

    const ids = [...new Set([...idlist.matchAll(/\d+/g)].map((x) => x[0]))];

    const invalid = ids.find((x) => x.startsWith("0") || x.length < 17 || x.length > 20);
    if (invalid) throw `Invalid ID \`${invalid}\` ${mdash} IDs should be 17-20 digit numbers.`;

    const response = await confirm(
        _,
        {
            embeds: [
                {
                    title: `Confirm massbanning ${ids.length} user${ids.length === 1 ? "" : "s"}`,
                    description: [
                        "No users will be notified, and any users who you or the bot cannot ban will be ignored.",
                        purge ? `${formatDuration(purge, DurationStyle.Blank)} of messages will be purged.` : "",
                    ]
                        .filter((x) => x)
                        .join(" "),
                    color: Colors.DarkVividPink,
                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                },
            ],
        },
        300000,
    );

    if (!response) return;

    await enforcePermissions(_.user, "massban", _.channel!);

    await response.update({
        ...template.progress("Massbanning in progress. Please be patient."),
        components: [{ type: ComponentType.ActionRow, components: [stopButton(_.user)] }],
    });

    const success: string[] = [];
    const historyEntries: ((typeof trpc)["addMultipleUserHistory"]["mutate"] extends (t: infer T) => unknown ? T : never)["entries"] = [];

    try {
        for (const id of ids) {
            if (await trpc.isHalted.query(response.message.id)) {
                await response.message.edit({
                    ...template.info(
                        `Massbanning was halted. ${success.length} user${success.length === 1 ? " was" : "s were"} already banned. Their ID${
                            success.length === 1 ? " is" : "s are"
                        } shown above.`,
                    ),
                    files: [{ name: "ids.txt", description: "users that were already banned", attachment: Buffer.from(formatIdList(success)) }],
                });

                return;
            }

            try {
                const user = await _.client.users.fetch(id);
                await checkPunishment(_, user, "ban");
                await _.guild.bans.create(user, { deleteMessageSeconds: purge / 1000, reason: reason ?? undefined });

                historyEntries.push({
                    user: user.id,
                    type: "ban",
                    mod: _.user.id,
                    duration: Infinity,
                    origin: response.message.url,
                    reason,
                });

                success.push(id);
            } catch {}
        }

        await response.message.edit({
            embeds: [
                {
                    title: "Success",
                    description: `Massbanned ${success.length} user${
                        success.length === 1 ? "" : "s"
                    } (this list may include users who were already banned previously). No users were DM'd.${
                        purge ? ` ${formatDuration(purge, DurationStyle.Blank)} of messages were purged.` : ""
                    }`,
                    color: Colors.Green,
                    fields: reason ? [{ name: "Reason", value: reason }] : [],
                },
            ],
            components: [],
        });
    } finally {
        if (historyEntries.length > 0) await trpc.addMultipleUserHistory.mutate({ guild: _.guild.id, entries: historyEntries });
    }
}
