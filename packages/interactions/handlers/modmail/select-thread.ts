import type { StringSelectMenuInteraction } from "discord.js";
import { sendModmail } from "../../../modmail/index.js";

export default async function (menu: StringSelectMenuInteraction) {
    const [guild, target] = menu.values[0].split("/");
    await sendModmail(menu, guild, +target);
}
