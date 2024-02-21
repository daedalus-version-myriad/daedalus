import { ButtonInteraction } from "discord.js";
import { trpc } from "../../api/index.js";
import { template } from "../../bot-utils/index.js";

export default async function (button: ButtonInteraction) {
    await trpc.halt.mutate(button.message.id);
    return template.info("Attempting to stop the ongoing action...");
}
