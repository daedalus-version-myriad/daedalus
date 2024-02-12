import { isModuleDisabled, isWrongClient, template } from "@daedalus/bot-utils";
import { escapeMarkdown, type StringSelectMenuInteraction } from "discord.js";
import { modmailReply, modmailTargetSelector } from "../../../modmail/lib.ts";

export default async function (menu: StringSelectMenuInteraction) {
    await menu.deferUpdate();

    try {
        const [id] = menu.values;
        if (!id.match(/^[1-9][0-9]{16,19}$/)) throw "Invalid server ID; a 17-20 digit number was expected.";

        const guild = await menu.client.guilds.fetch(id).catch(() => null);
        if (!guild) throw "Invalid server ID; could not fetch that server. Make sure you inputted the ID correctly.";

        if (await isWrongClient(guild.client, guild))
            throw `This is not the correct modmail bot for **${escapeMarkdown(guild.name)}** (its configuration changed since this prompt was posted). Please find the client that that guild is using.`;
        if (await isModuleDisabled(guild, "modmail"))
            throw `**${escapeMarkdown(guild.name)}** does not have modmail enabled (it was disabled since this prompt was posted).`;

        await modmailReply(menu, modmailTargetSelector(guild, true));
    } catch (error) {
        if (typeof error !== "string") throw error;
        await menu.followUp(template.error(error));
    }
}
