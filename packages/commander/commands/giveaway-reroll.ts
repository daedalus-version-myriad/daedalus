import { trpc } from "../../api/index.js";
import { getColor, type Commands } from "../../bot-utils/index.js";
import { englishList } from "../../formatting/index.js";
import { draw } from "../../giveaways/index.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("giveaway reroll")
            .description("reroll a giveaway")
            .numberOption("id", "the ID of the giveaway", { required: true })
            .numberOption("winners", "the number of winners to roll")
            .fn(async ({ _, id, winners }) => {
                const giveaway = await trpc.getGiveawayById.query({ guild: _.guild!.id, id });

                if (!giveaway) throw "That giveaway does not exist.";
                if (!giveaway.closed) throw "That giveaway has not been closed yet.";

                await _.deferReply();

                const result = await draw(_.guild!, giveaway, winners ?? giveaway.winners);

                return {
                    embeds: [
                        {
                            title: `**Reroll Results (ID: ${id})**`,
                            description: result.length > 0 ? `Congratulations to ${englishList(result)}!` : "Nobody was eligible.",
                            color: await getColor(_.guild!),
                        },
                    ],
                };
            }),
    );
