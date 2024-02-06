import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient, obtainLimit, template } from "@daedalus/bot-utils";
import type { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction, _row: string, _col: string) {
    const row = +_row;
    const col = +_col;

    if (await isWrongClient(button.client, button.guild!))
        throw 'This server is no longer using this client. Reaction role prompts need to be set up again, which can be done by simply clicking "save" on the dashboard.';

    if (await isModuleDisabled(button.guild!, "reaction-roles")) throw "The Reaction Roles module is disabled.";

    const entries = await trpc.getReactionRoleEntries.query({ guild: button.guild!.id });

    const entry = entries
        .slice(0, (await obtainLimit(button.guild!.id, "reactionRolesCountLimit")) as number)
        .find((entry) => entry.message === button.message.id);

    if (!entry) return;
    if (entry.error) throw "This reaction role prompt is out of sync due to an error with its last save. Server management can fix this on the dashboard.";
    if (entry.style !== "buttons") return;

    if (row >= entry.buttonData.length || col >= entry.buttonData[row].length)
        throw `Index error: row ${row} / col ${col} is not valid for this prompt. Please report this to support.`;

    const roles = entry.buttonData.flatMap((x) => x.map((x) => x.role!));
    const add = entry.buttonData[row][col].role!;
    const remove = roles.filter((x) => x !== add);
    const member = await button.guild!.members.fetch(button.user);

    if (entry.type === "lock") {
        if (member.roles.cache.hasAny(...roles)) throw `You already have one of these roles, and it is locked, so you cannot remove or change it.`;
        await member.roles.add(add);
        return template.success(`Locked in <@&${add}>.`);
    } else if (entry.type === "normal" || entry.type === "unique") {
        if (member.roles.cache.has(add)) {
            await member.roles.remove(add);
            return template.success(`Removed <@&${add}>.`);
        } else if (entry.type === "normal") {
            await member.roles.add(add);
            return template.success(`Added <@&${add}>.`);
        } else {
            await member.roles.set([...new Set([...[...member.roles.cache.keys()].filter((x) => !remove.includes(x)), add])]);
            return template.success(`Set your selected role to <@&${add}>.`);
        }
    } else {
        if (!member.roles.cache.has(add)) await member.roles.add(add);
        return template.success(`Added <@&${add}>.`);
    }
}
