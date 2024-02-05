import { trpc } from "@daedalus/api";
import { checkPermissions, template } from "@daedalus/bot-utils";
import type { ButtonInteraction } from "discord.js";

export default async function (button: ButtonInteraction, user: string) {
    const deny = await checkPermissions(button.user, "xp", button.channel!);
    if (deny) return void (await button.update(template.error(deny)));

    await trpc.resetXp.mutate({ guild: button.guild!.id, user });
    await button.update(template.success(`<@${user}>'s XP has been fully reset.`));
}
