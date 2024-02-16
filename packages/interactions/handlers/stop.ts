import { trpc } from "@daedalus/api";
import { template } from "@daedalus/bot-utils";
import { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction) {
    await trpc.halt.mutate(button.message.id);
    return template.info("Attempting to stop the ongoing action...");
}
