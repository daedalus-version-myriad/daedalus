import { trpc } from "@daedalus/api";
import { defer, getColor, mdash, type Commands } from "@daedalus/bot-utils";
import { xpToLevel } from "@daedalus/xp";
import type { APIEmbedField } from "discord.js";

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

                for (const key of type === "both" ? (["text", "voice"] as const) : [type]) {
                    const entries = await trpc.getXpTop.query({ guild: _.guild!.id, key: `${key}${range}`, page, limit });
                    const list = entries.map(
                        (x, i) =>
                            `\`#${offset + i}.\` <@${x.user}> ${mdash}${range === "Total" ? ` lvl. ${xpToLevel(x.amount)}` : ""} (${Math.floor(x.amount)})`,
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
