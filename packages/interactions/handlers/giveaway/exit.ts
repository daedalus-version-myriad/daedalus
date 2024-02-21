import { ButtonInteraction, Colors } from "discord.js";
import { trpc } from "../../../api/index.js";

export default async function (button: ButtonInteraction, _id: string) {
    const id = parseInt(_id);

    const giveaway = await trpc.getGiveawayById.query({ guild: button.guild!.id, id });

    if (!giveaway) throw "This giveaway appears to no longer exist.";
    if (giveaway.deadline < Date.now()) throw "This giveaway has already ended.";

    const alreadyGone = await trpc.removeGiveawayEntry.mutate({ guild: button.guild!.id, id: giveaway.id, user: button.user.id });

    await button.update({
        embeds: [
            {
                title: "Giveaway Entry Withdrawn",
                description: alreadyGone ? "You already did not have an entry in the giveaway." : "You have withdrawn your entry from the giveaway.",
                color: alreadyGone ? Colors.Blue : Colors.Green,
            },
        ],
        components: [],
    });
}
