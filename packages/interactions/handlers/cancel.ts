import { embed } from "@daedalus/bot-utils";
import { type ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction) {
    await button.update(embed("Action Canceled", "This action was canceled.", 0x2b2d31));
}
