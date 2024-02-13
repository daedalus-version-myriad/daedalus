import { isModuleDisabled, isWrongClient, template } from "@daedalus/bot-utils";
import { modmailReply, modmailTargetSelector } from "@daedalus/modmail";
import { escapeMarkdown, type MessageComponentInteraction, type ModalMessageModalSubmitInteraction } from "discord.js";

export async function handleServerSelection(interaction: MessageComponentInteraction | ModalMessageModalSubmitInteraction, id: string) {
    await interaction.deferUpdate();

    try {
        if (!id.match(/^[1-9][0-9]{16,19}$/)) throw "Invalid server ID; a 17-20 digit number was expected.";

        const guild = await interaction.client.guilds.fetch(id).catch(() => null);
        if (!guild) throw "Invalid server ID; could not fetch that server. Make sure you inputted the ID correctly.";

        if (await isWrongClient(guild.client, guild))
            throw `This is not the correct modmail bot for **${escapeMarkdown(guild.name)}**. Please find the client that that guild is using.`;
        if (await isModuleDisabled(guild, "modmail")) throw `**${escapeMarkdown(guild.name)}** does not have modmail enabled.`;

        await modmailReply(interaction, modmailTargetSelector(guild, true));
    } catch (error) {
        if (typeof error !== "string") throw error;
        await interaction.followUp(template.error(error));
    }
}
