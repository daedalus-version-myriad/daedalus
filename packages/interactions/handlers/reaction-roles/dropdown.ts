import type { StringSelectMenuInteraction } from "discord.js";
import { trpc } from "../../../api/index.js";
import { isModuleDisabled, isWrongClient, obtainLimit, template } from "../../../bot-utils/index.js";
import { englishList } from "../../../formatting/index.js";

export default async function (menu: StringSelectMenuInteraction) {
    await menu.deferReply({ ephemeral: true });

    if (await isWrongClient(menu.client, menu.guild!))
        throw 'This server is no longer using this client. Reaction role prompts need to be set up again, which can be done by simply clicking "save" on the dashboard.';

    if (await isModuleDisabled(menu.guild!, "reaction-roles")) throw "The Reaction Roles module is disabled.";

    const entries = await trpc.getReactionRoleEntries.query(menu.guild!.id);

    const entry = entries.slice(0, (await obtainLimit(menu.guild!.id, "reactionRolesCountLimit")) as number).find((entry) => entry.message === menu.message.id);

    if (!entry) return;
    if (entry.error) throw "This reaction role prompt is out of sync due to an error with its last save. Server management can fix this on the dashboard.";
    if (entry.addToExisting || entry.style !== "dropdown") return;

    const roles = entry.dropdownData.map((x) => x.role!);
    const add = menu.values.map((x) => roles[+x]);
    const remove = roles.filter((x) => !add.includes(x));
    const member = await menu.guild!.members.fetch(menu.user);

    if (entry.type === "lock") {
        if (member.roles.cache.hasAny(...roles)) throw `You already have one of these roles, and it is locked, so you cannot remove or change it.`;

        await member.roles.add([...new Set(add)]);
        return template.success(`Locked in <@&${add[0]}>.`);
    } else if (entry.type === "normal" || entry.type === "unique") {
        await member.roles.set([...new Set([...[...member.roles.cache.keys()].filter((x) => !remove.includes(x)), ...add])]);

        if (add.length === 0) return template.success(`Removed all of your roles from this prompt.`);
        else return template.success(`Set your selected role${add.length === 1 ? "" : "s"} to ${englishList(add.map((x) => `<@&${x}>`))}.`);
    } else if (entry.type === "verify") {
        if (add.length === 0) return template.success(`No roles were added.`);

        await member.roles.add([...new Set(add)]);
        return template.success(`Added ${englishList(add.map((x) => `<@&${x}>`))}.`);
    }
}
