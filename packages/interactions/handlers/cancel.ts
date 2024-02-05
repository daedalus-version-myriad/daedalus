import { ButtonStyle, ComponentType, type ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction) {
    await button.update({
        content: null,
        embeds: [
            {
                title: "Action Canceled",
                description: "This action was canceled.",
                color: 0x2b2d31,
            },
        ],
        files: [],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        customId: ".",
                        label: "Canceled",
                        disabled: true,
                    },
                ],
            },
        ],
    });
}
