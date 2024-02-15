import { trpc } from "@daedalus/api";
import { type APIButtonComponent, type ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction, vote: string) {
    await button.deferUpdate();

    const [yes, no] = await trpc.suggestionVote.mutate({ message: button.message.id, user: button.user.id, yes: vote === "yes" });

    const components = button.message.components.map((row) => row.toJSON());

    (components[0].components[0] as APIButtonComponent).label = `${yes}`;
    (components[0].components[1] as APIButtonComponent).label = `${no}`;

    await button.editReply({ components });
}
