import { trpc } from "@daedalus/api";
import { renderPollFor } from "@daedalus/polls";
import { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction) {
    const noVote = await trpc.pollAbstain.mutate({ message: button.message.id, user: button.user.id });
    if (noVote) throw "You already did not have a vote in this poll.";
    await button.update(await renderPollFor(button.message.id, button.guild!));
}
