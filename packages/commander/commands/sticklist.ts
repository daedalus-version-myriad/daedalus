import { trpc } from "@daedalus/api";
import { getColor, pagify, truncate, type Commands } from "@daedalus/bot-utils";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("sticklist")
            .description("list the server's sticky messages")
            .fn(async ({ _ }) => {
                let entries = await trpc.listStickyMessages.query(_.guild!.id);

                const toDelete = entries.map((entry) => entry.channel).filter((channel) => !_.guild!.channels.cache.has(channel));
                if (toDelete.length > 0) await trpc.deleteManyStickyMessages.mutate(toDelete);

                entries = entries.filter((entry) => !toDelete.includes(entry.channel));

                const messages = [];

                while (entries.length > 0)
                    messages.push({
                        embeds: [
                            {
                                title: "Sticky Messages",
                                color: await getColor(_.guild!),
                                fields: entries.splice(0, 5).map((entry) => ({
                                    name: `<#${entry.channel}>`,
                                    value: truncate(entry.content, 1024),
                                })),
                            },
                        ],
                    });

                await pagify(_, messages);
            }),
    );
