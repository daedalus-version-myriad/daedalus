import { template } from "@daedalus/bot-utils";
import type { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction, source: string) {
    return template.confirm("Confirm deleting this modmail message?", button.user.id, `modmail/confirm-delete:${source}`);
}
