import { trpc } from "../../api/index.js";
import { defer, getColor, type Commands } from "../../bot-utils/index.js";
import { secrets } from "../../config/index.js";
import { xpToLevel } from "../../xp/index.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("rank")
            .description("get a user's XP and rank")
            .userOption("user", "the user (default = yourself)")
            .fn(defer(false))
            .fn(async ({ _, user }) => {
                user ??= _.user;

                const { text, voice, textRank, voiceRank } = await trpc.getXpRank.query({ guild: _.guild!.id, user: user.id });
                const { rankCardBackground: url } = await trpc.getXpConfig.query(_.guild!.id);

                return {
                    embeds: [
                        {
                            title: `XP Card for ${user.displayName}`,
                            description: `${user} is...\n- text level ${xpToLevel(text)} (rank #${textRank}, ${Math.floor(text)} XP, ${Math.floor((xpToLevel(text, false) % 1) * 100)}% to next level)\n- voice level ${xpToLevel(voice)} (rank #${voiceRank}, ${Math.floor(voice)} XP, ${Math.floor((xpToLevel(voice, false) % 1) * 100)}% to next level)`,
                            color: await getColor(_.guild!),
                            image: { url: url || secrets.ASSETS.XP_RANK_CARD_IMAGE },
                        },
                    ],
                };
            }),
    );
