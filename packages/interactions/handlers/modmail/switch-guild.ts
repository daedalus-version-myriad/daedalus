import { modmailGuildSelector, modmailReply } from "@daedalus/modmail";
import type { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction) {
    await modmailReply(button, modmailGuildSelector(button.user));
}
