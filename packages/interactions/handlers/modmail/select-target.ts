import { sendModmail } from "@daedalus/modmail";
import type { StringSelectMenuInteraction } from "discord.js";

export default async function (menu: StringSelectMenuInteraction, guild: string) {
    await sendModmail(menu, guild, +menu.values[0]);
}
