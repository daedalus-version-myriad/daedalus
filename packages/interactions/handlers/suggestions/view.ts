import { trpc } from "@daedalus/api";
import { checkPermissions, expand, template } from "@daedalus/bot-utils";
import { ButtonInteraction } from "discord.js";
import { clients } from "../../main";

export default async function (button: ButtonInteraction) {
    if (await checkPermissions(button.user, "suggestion", button.channel!)) throw "You do not have permission to view anonymous suggestions' authors.";

    const entry = await trpc.getSuggestion.query(button.message.id);
    if (!entry) throw "This is not a suggestion post.";

    const user = await (await clients.getBot())?.users.fetch(entry.user).catch(() => {});

    if (!user) throw `The suggestion author's account no longer exists or could not be fetched. (ID: \`${user}\`)`;
    return template.info(`Suggestion #${entry.id} was submitted by ${expand(user)}.`);
}
