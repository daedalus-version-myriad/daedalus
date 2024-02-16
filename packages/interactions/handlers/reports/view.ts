import { trpc } from "@daedalus/api";
import { expand, template } from "@daedalus/bot-utils";
import { ButtonInteraction } from "discord.js";
import { clients } from "../../main";

export default async function (button: ButtonInteraction) {
    const caller = await button.guild!.members.fetch(button.user);

    if (caller.id !== button.guild!.ownerId) {
        const config = await trpc.getReportsConfig.query(button.guild!.id);
        if (!caller.roles.cache.hasAny(...config.viewRoles)) throw "You do not have permission to view anonymous reporters.";
    }

    const id = await trpc.getReporter.query(button.message.id);
    if (!id) throw "The reporter could not be found.";

    const user = await (await clients.getDefaultBot()).users.fetch(id).catch(() => null);
    if (!user) throw "The reporter's account no longer exists.";

    return template.info(`That report was submitted by ${expand(user)}.`);
}
