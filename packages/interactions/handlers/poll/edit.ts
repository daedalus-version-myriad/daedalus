import { trpc } from "@daedalus/api";
import { template } from "@daedalus/bot-utils";
import { renderPollFor } from "@daedalus/polls";
import { ButtonInteraction, ComponentType, TextInputStyle } from "discord.js";

export default async function (button: ButtonInteraction) {
    const value = await trpc.getPollQuestion.query(button.message.id);
    if (!value) throw "Unexpected error: poll not found for this message.";

    await button.showModal({
        title: "Editing Poll (30 minutes to fill out)",
        customId: "edit-poll",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "question",
                        label: "Question",
                        required: true,
                        maxLength: 1024,
                        value: value,
                    },
                ],
            },
        ],
    });

    const modal = await button.awaitModalSubmit({ time: 30 * 60 * 1000 }).catch(() => {});
    if (!modal) return;

    await modal.deferReply({ ephemeral: true });

    const question = modal.fields.getTextInputValue("question");
    await trpc.setPollQuestion.mutate({ message: button.message.id, question });

    await button.message.edit(await renderPollFor(button.message.id, button.guild!));
    await modal.editReply(template.success("Your poll has been edited."));
}
