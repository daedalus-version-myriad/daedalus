import { sendModmail } from "@daedalus/modmail";
import type { StringSelectMenuInteraction } from "discord.js";

export default async function (menu: StringSelectMenuInteraction) {
    const [guild, target] = menu.values[0].split("/");
    await sendModmail(menu, guild, +target);
}
