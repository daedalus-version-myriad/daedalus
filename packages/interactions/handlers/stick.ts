import { ModalSubmitInteraction, type GuildTextBasedChannel } from "discord.js";
import { trpc } from "../../api/index.js";
import { updateStick } from "../../sticky-messages/index.js";

export default async function (modal: ModalSubmitInteraction, seconds_: string) {
    await modal.deferReply({ ephemeral: true });

    const seconds = parseInt(seconds_);
    const content = modal.fields.getTextInputValue("message");

    await trpc.setStickyMessage.mutate({ guild: modal.guild!.id, channel: modal.channel!.id, content, seconds });

    await updateStick(modal.channel as GuildTextBasedChannel);
    return "Sticky message updated.";
}
