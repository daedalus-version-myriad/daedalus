import { trpc } from "@daedalus/api";
import { enforcePermissions, template } from "@daedalus/bot-utils";
import { ModalSubmitInteraction } from "discord.js";

export default async function (cmd: ModalSubmitInteraction, user: string) {
    await enforcePermissions(cmd.user, "notes", cmd.channel!);

    const notes = cmd.fields.getTextInputValue("notes");
    await trpc.setUserNotes.mutate({ guild: cmd.guild!.id, user, notes });
    return template.success(`<@${user}>'s mod notes were ${notes ? `updated:\n\n${notes}` : "cleared"}`);
}
