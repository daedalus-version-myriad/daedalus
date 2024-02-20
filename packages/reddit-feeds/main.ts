import { trpc } from "@daedalus/api";
import { getColor, isModuleDisabled, obtainLimit, truncate } from "@daedalus/bot-utils";
import type { ClientManager } from "@daedalus/clients";
import he from "he";

let manager: ClientManager;
export const redditFeedsHook = (_: unknown, x: ClientManager) => (manager = x);

async function run() {
    if (!manager) return;

    for (const [guildId, feeds] of await trpc.getAllRedditFeeds.query()) {
        if (await isModuleDisabled(guildId, "reddit-feeds")) continue;

        const client = await manager.getBot(guildId);
        if (!client) continue;

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) continue;

        for (const { subreddit, channel: id } of feeds.slice(0, (await obtainLimit(guildId, "redditFeedsCountLimit")) as number)) {
            if (!id) continue;

            const channel = await guild.channels.fetch(id).catch(() => null);
            if (!channel?.isTextBased()) continue;

            const color = await getColor(guild);

            const request = await fetch(`https://reddit.com/r/${subreddit}/new/.json`, {
                headers: { "User-Agent": "daedalus (daedalusbot.xyz)" },
            });

            if (!request.ok) {
                console.error(request.status, await request.text());
                continue;
            }

            const response = (await request.json()) as any;

            const posts = response.data.children
                .map((x: any) => x.data)
                .filter((x: any) => !x.over_18 && x.created_utc * 1000 >= Date.now() - 60 * 1000)
                .slice(0, 6)
                .reverse();

            (async () => {
                for (const post of posts) {
                    const url = post.url.match(/\.(png|jpg)$/) ? post.url : null;
                    const title = he.decode(post.title);

                    await channel
                        .send({
                            embeds: [
                                {
                                    title: truncate(title, 256),
                                    description: truncate(post.selftext, 4096),
                                    color,
                                    image: url ? { url } : undefined,
                                    url: `https://reddit.com${post.permalink}`,
                                    footer: { text: `Posted by u/${post.author} in ${post.subreddit_name_prefixed}` },
                                },
                            ],
                        })
                        .catch(console.error);

                    await new Promise((r) => setTimeout(r, (60 * 1000) / posts.length));
                }
            })();
        }
    }
}

setTimeout(
    () => {
        run();
        setInterval(run, 60000);
    },
    60000 - (Date.now() % 60000),
);
