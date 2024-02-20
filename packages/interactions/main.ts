import { reply, template } from "@daedalus/bot-utils";
import { Client, Events } from "discord.js";

export const interactionsHook = (client: Client) =>
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;

        const [_, user, path, ...args] = ((interaction.isModalSubmit() ? ":" : "") + interaction.customId).split(":");

        if (!path) return;
        if (user && interaction.user.id !== user)
            return void (await interaction.reply(template.error("This interaction prompt does not belong to you.")).catch(() => null));

        let fn: any;

        try {
            fn = require(`./handlers/${path}.js`).default;
        } catch (error) {
            console.error(path, error);
            return void (await interaction
                .reply(template.error(`That interaction's handler is not implemented yet (path: \`${path}\`). Please contact support.`))
                .catch(() => null));
        }

        try {
            const response = await fn(interaction, ...args);
            if (!response) return;

            await reply(interaction, response);
        } catch (error: any) {
            if (typeof error === "string") return void (await reply(interaction, template.error(error)));

            const id = crypto.randomUUID();
            console.error(id, error);

            return void (await reply(
                interaction,
                template.error(
                    `An unexpected error occurred. We sincerely apologize for this issue. Please contact support if this issue persists. This error has ID \`${id}\`.`,
                ),
            ));
        }
    });
