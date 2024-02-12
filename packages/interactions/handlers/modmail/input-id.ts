import { ComponentType, TextInputStyle, type ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction) {
    await button.showModal({
        title: "Server Selection",
        customId: ":modmail/select-id",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Short,
                        label: "Server ID",
                        customId: "id",
                        placeholder: "Enter the server ID, not its name.",
                        minLength: 17,
                        maxLength: 20,
                    },
                ],
            },
        ],
    });
}
