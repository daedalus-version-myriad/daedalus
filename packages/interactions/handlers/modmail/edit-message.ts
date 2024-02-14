import { trpc } from "@daedalus/api";
import { getModmailContactInfo } from "@daedalus/modmail";
import { ComponentType, TextInputStyle, type ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction, source: string) {
    const { thread } = await getModmailContactInfo(false)({ _: button });
    const message = await trpc.getOutgoingModmailMessage.query({ uuid: thread.uuid, source });

    if (!message) throw "This message could not be fetched in this modmail thread and cannot be edited.";

    await button.showModal({
        title: "Edit Modmail Message",
        customId: `:modmail/save:${source}`,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "message",
                        label: "Message",
                        maxLength: 4000,
                        value: message.content,
                        required: button.message.attachments.size === 0,
                    },
                ],
            },
        ],
    });
}
