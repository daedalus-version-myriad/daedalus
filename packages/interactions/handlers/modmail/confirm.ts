import type { ButtonInteraction } from "discord.js";
import { sendModmail } from "../../../modmail/index.js";

export default async function (button: ButtonInteraction, guild: string, target: string) {
    await sendModmail(button, guild, +target);
}
