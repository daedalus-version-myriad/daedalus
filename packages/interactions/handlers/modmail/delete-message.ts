import type { ButtonInteraction } from "discord.js";
import { template } from "../../../bot-utils/index.js";

export default async function (button: ButtonInteraction, source: string) {
    return template.confirm("Confirm deleting this modmail message?", button.user.id, `modmail/confirm-delete:${source}`);
}
