import { trpc } from "@daedalus/api";
import { fetchCaller, getColor, mdash, type Commands } from "@daedalus/bot-utils";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("co-op")
            .description("request co-op help (Genshin Impact)")
            .stringOption("query", "what you need help for", { maxLength: 1024 })
            .numberOption("world-level", "your world level (if you have a world-level role, you can leave this blank)", { minimum: 0, maximum: 8 })
            .stringOption("region", "your region (if you have a region role, you can leave this blank)", {
                choices: { NA: "NA (Americas)", EU: "EU (Europe)", AS: "AS (Asia)", SA: "TW/HK/MO (Special Administrative Regions)" },
            })
            .fn(fetchCaller)
            .fn(async ({ _, caller, query, "world-level": worldLevel, region }) => {
                const now = Date.now();

                if (ratelimit.has(_.user.id) && now - ratelimit.get(_.user.id)! < 1800000)
                    throw "You may only use this command once every half an hour (globally).";

                const config = await trpc.getCoOpConfig.query(_.guild!.id);

                if (worldLevel === null)
                    for (let i = 0; i <= 8; i++)
                        if (config[`wl${i}` as keyof typeof config] && caller.roles.cache.has(config[`wl${i}` as keyof typeof config]!))
                            if (worldLevel !== null) {
                                worldLevel = null;
                                break;
                            } else worldLevel = i;

                if (worldLevel === null) throw "Please specify your world level.";

                if (region === null)
                    for (const i of ["NA", "EU", "AS", "SA"] as const)
                        if (config[`region${i}`] && caller.roles.cache.has(config[`region${i}`]!))
                            if (region !== null) {
                                region = null;
                                break;
                            } else region = i;

                if (region === null) throw "Please specify your server region.";

                ratelimit.set(_.user.id, now);

                return {
                    content: config[`helper${region}`] ? `<@&${config[`helper${region}`]}>` : "",
                    embeds: [
                        {
                            title: `Co-op Request ${mdash} World Level ${worldLevel} ${mdash} ${
                                { NA: "NA (Americas)", EU: "EU (Europe)", AS: "AS (Asia)", SA: "TW/HK/MO (Special Administrative Regions)" }[region]
                            }`,
                            description: `${_.user} is requesting help${query ? ` with: ${query}` : ""}`,
                            color: await getColor(_.guild!),
                        },
                    ],
                    allowedMentions: { parse: ["roles"] },
                    ephemeral: false,
                };
            }),
    );

const ratelimit = new Map<string, number>();
