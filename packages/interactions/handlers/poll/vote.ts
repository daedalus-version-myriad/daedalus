import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import { trpc } from "../../../api/index.js";
import { renderPollFor } from "../../../polls/index.js";

export default async function (interaction: ButtonInteraction | StringSelectMenuInteraction, option: string) {
    const poll = await trpc.getPollWithoutVotes.query(interaction.message.id);
    if (!poll) throw "Unexpected error: poll not found for this message.";

    if (poll.type === "binary") option = { yes: poll.leftOption, meh: "", no: poll.rightOption }[option]!;

    const vote = interaction.isStringSelectMenu() ? JSON.stringify(interaction.values) : option;
    await trpc.pollVote.mutate({ message: interaction.message.id, user: interaction.user.id, vote });

    await interaction.update(await renderPollFor(interaction.message.id, interaction.guild!));
}
