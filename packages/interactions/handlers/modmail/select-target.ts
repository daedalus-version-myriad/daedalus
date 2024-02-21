import type { StringSelectMenuInteraction } from "discord.js";
import { sendModmail } from "../../../modmail/index.js";

export default async function (menu: StringSelectMenuInteraction, guild: string) {
    await sendModmail(menu, guild, +menu.values[0]);
}
