import { ButtonInteraction } from "discord.js";
import { enforcePermissions } from "../../../bot-utils/index.js";

export default async function (button: ButtonInteraction) {
    await enforcePermissions(button.user, "poll", button.channel!);

    await button.update({
        components: button.message.components.map((row) => ({
            type: row.type,
            components: row.components.map((x) => ({
                ...x.toJSON(),
                ...(x.customId === "::poll/open" ? { customId: "::poll/close", label: "Close" } : { disabled: false }),
            })),
        })),
    });
}
