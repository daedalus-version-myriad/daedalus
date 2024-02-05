import { embed } from "@daedalus/bot-utils";
import { ButtonStyle, Colors, ComponentType, type StringSelectMenuInteraction } from "discord.js";

export default async function (menu: StringSelectMenuInteraction) {
    const [mode] = menu.values;

    if (mode === "cancel") return void (await menu.update(embed("Action Canceled", "This action was canceled.", 0x2b2d31)));

    await menu.update({
        embeds: [
            {
                title: "Confirm importing XP from MEE6",
                description: `You are about to import XP from MEE6 into Daedalus. This will ${
                    {
                        add: "be added to existing Daedalus XP",
                        replace: "replace all existing Daedalus XP",
                        keep: "be imported for users without Daedalus XP but will not be added to other users",
                    }[mode]
                }. Voice XP will not be affected. This action is **irreversible**.`,
                color: Colors.DarkVividPink,
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    { type: ComponentType.Button, style: ButtonStyle.Success, customId: `:${menu.user.id}:xp/mee6-import/confirm:${mode}`, label: "Import" },
                    { type: ComponentType.Button, style: ButtonStyle.Danger, customId: `:${menu.user.id}:cancel`, label: "Cancel" },
                ],
            },
        ],
    });
}
