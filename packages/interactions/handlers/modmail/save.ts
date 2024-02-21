import { Colors, type Message, type ModalSubmitInteraction } from "discord.js";
import { trpc } from "../../../api/index.js";
import { getModmailContactInfo } from "../../../modmail/index.js";

export default async function (modal: ModalSubmitInteraction, source: string) {
    const { member, thread } = await getModmailContactInfo(false)({ _: modal });

    await modal.deferReply();

    const data = await trpc.getOutgoingModmailMessage.query({ uuid: thread.uuid, source });
    if (!data) throw "This message could not be fetched in this modmail thread and cannot be edited.";

    let message: Message;

    try {
        message = await (await member.createDM()).messages.fetch(data.target);
        if (!message) throw 0;
    } catch {
        throw "Failed to fetch the corresponding outgoing message.";
    }

    const description = modal.fields.getTextInputValue("message");

    await message.edit({ embeds: [{ ...message.embeds[0].toJSON(), description }] });
    await trpc.recordOutgoingModmailMessageEdit.mutate({ uuid: thread.uuid, source, content: description });

    return { embeds: [{ title: "Outgoing Message Edited", description, color: Colors.Green }] };
}
