import { type ModalMessageModalSubmitInteraction } from "discord.js";
import { handleServerSelection } from "../../lib/modmail";

export default async function (modal: ModalMessageModalSubmitInteraction) {
    await handleServerSelection(modal, modal.fields.getTextInputValue("id"));
}
