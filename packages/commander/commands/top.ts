import type { APIEmbedField } from "discord.js";
import { trpc } from "../../api/index.js";
import { defer, getColor, mdash, type Commands } from "../../bot-utils/index.js";
import { xpToLevel } from "../../xp/index.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("top")
            .description("get top users by XP")
            .stringOption("type", "return only text or voice XP (default: both)", { choices: { text: "text", voice: "voice", both: "both" } })
            .stringOption("range", "the time range to return", { choices: { Total: "all-time", Monthly: "monthly", Weekly: "weekly", Daily: "daily" } })
            .numberOption("page", "the page to return", { minimum: 1 })
            .fn(defer(false))
            .fn(async ({ _, type, range, page }) => {
                type ??= "both";
                page ??= 1;
                range ??= "Total";

                const limit = type === "both" ? 5 : 10;
                const size = await trpc.getXpSize.query(_.guild!.id);

                const offset = (page - 1) * limit + 1;

                const fields: APIEmbedField[] = [];

                let self: { text: number; voice: number; textRank: number; voiceRank: number } | null = null;

                for (const key of type === "both" ? (["text", "voice"] as const) : [type]) {
                    const entries = (await trpc.getXpTop.query({ guild: _.guild!.id, key: `${key}${range}`, page, limit })).map(
                        (x, i) => [offset + i, x] as [number, typeof x],
                    );

                    if (!entries.some(([, x]) => x.user === _.user.id)) {
                        self ??= await trpc.getXpRank.query({ guild: _.guild!.id, user: _.user.id });
                        const value = self[`${key}Rank`];

                        if (value < offset) entries.unshift([value, { user: _.user.id, amount: self[key] }]);
                        else entries.push([value, { user: _.user.id, amount: self[key] }]);
                    }

                    const list = entries.map(
                        ([r, x]) => `\`#${r}.\` <@${x.user}> ${mdash}${range === "Total" ? ` lvl. ${xpToLevel(x.amount)}` : ""} (${Math.floor(x.amount)})`,
                    );

                    fields.push({
                        name: `${{ text: "Text", voice: "Voice" }[key]} [${page} / ${Math.ceil(size / limit)}]`,
                        value: list.join("\n") || "(nothing here)",
                        inline: true,
                    });
                }

                return {
                    embeds: [
                        {
                            title: `:clipboard: ${range === "Total" ? "All-Time" : range} XP Leaderboard`,
                            fields,
                            color: await getColor(_.guild!),
                            footer: { text: _.user.tag, icon_url: (_.guild!.members.cache.get(_.user.id) ?? _.user).displayAvatarURL({ size: 64 }) },
                            timestamp: new Date().toISOString(),
                        },
                    ],
                };
            }),
    );
