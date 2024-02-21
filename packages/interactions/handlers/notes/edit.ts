import { ModalSubmitInteraction } from "discord.js";
import { trpc } from "../../../api/index.js";
import { enforcePermissions, template } from "../../../bot-utils/index.js";

export default async function (cmd: ModalSubmitInteraction, user: string) {
    await enforcePermissions(cmd.user, "notes", cmd.channel!);

    const notes = cmd.fields.getTextInputValue("notes");
    await trpc.setUserNotes.mutate({ guild: cmd.guild!.id, user, notes });
    return template.success(`<@${user}>'s mod notes were ${notes ? `updated:\n\n${notes}` : "cleared"}`);
}
