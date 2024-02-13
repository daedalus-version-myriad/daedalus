import { type StringSelectMenuInteraction } from "discord.js";
import { handleServerSelection } from "../../lib/modmail";

export default async function (menu: StringSelectMenuInteraction) {
    await handleServerSelection(menu, menu.values[0]);
}
