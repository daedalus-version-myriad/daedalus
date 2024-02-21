import { type StringSelectMenuInteraction } from "discord.js";
import { handleServerSelection } from "../../lib/modmail.js";

export default async function (menu: StringSelectMenuInteraction) {
    await handleServerSelection(menu, menu.values[0]);
}
