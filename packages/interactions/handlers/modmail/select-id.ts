import { type ModalMessageModalSubmitInteraction } from "discord.js";
import { handleServerSelection } from "../../lib/modmail.js";

export default async function (modal: ModalMessageModalSubmitInteraction) {
    await handleServerSelection(modal, modal.fields.getTextInputValue("id"));
}
