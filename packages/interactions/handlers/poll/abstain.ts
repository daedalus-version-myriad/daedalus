import { ButtonInteraction } from "discord.js";
import { trpc } from "../../../api/index.js";
import { renderPollFor } from "../../../polls/index.js";

export default async function (button: ButtonInteraction) {
    const noVote = await trpc.pollAbstain.mutate({ message: button.message.id, user: button.user.id });
    if (noVote) throw "You already did not have a vote in this poll.";
    await button.update(await renderPollFor(button.message.id, button.guild!));
}
