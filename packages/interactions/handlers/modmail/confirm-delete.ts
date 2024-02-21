import { Colors, type ButtonInteraction, type Message } from "discord.js";
import { trpc } from "../../../api/index.js";
import { getModmailContactInfo } from "../../../modmail/index.js";

export default async function (button: ButtonInteraction, source: string) {
    const { member, thread } = await getModmailContactInfo(false)({ _: button });

    await button.deferUpdate();

    const data = await trpc.getOutgoingModmailMessage.query({ uuid: thread.uuid, source });
    if (!data) throw "This message could not be fetched in this modmail thread and cannot be deleted.";

    let message: Message;

    try {
        message = await (await member.createDM()).messages.fetch(data.target);
        if (!message) throw 0;
    } catch {
        throw "Failed to fetch the corresponding outgoing message.";
    }

    await message.edit({
        embeds: [
            {
                title: `Incoming Message Deleted (${button.guild!.name})`,
                description: "A modmail message was sent to you but later deleted.",
                color: Colors.Red,
            },
        ],
        files: [],
    });

    await trpc.recordOutgoingModmailMessageDelete.mutate({ uuid: thread.uuid, source });

    try {
        const message = await button.message.fetchReference();
        if (!message) throw 0;

        await message.edit({ components: [] });
        await message.reply({ embeds: [{ title: "Deleted", description: "This message was deleted by its author.", color: Colors.Red }] });
    } catch {}

    return { embeds: [{ title: "Outgoing Message Deleted", color: Colors.Green }] };
}
