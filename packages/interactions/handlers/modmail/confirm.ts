import { sendModmail } from "@daedalus/modmail";
import type { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction, guild: string, target: string) {
    await sendModmail(button, guild, +target);
}
