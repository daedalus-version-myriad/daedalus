import type { ButtonInteraction } from "discord.js";
import { modmailGuildSelector, modmailReply } from "../../../modmail/index.js";

export default async function (button: ButtonInteraction) {
    await modmailReply(button, modmailGuildSelector(button.user));
}
