import { trpc } from "@daedalus/api";
import { countEntries } from "@daedalus/giveaways";
import { ButtonInteraction, ButtonStyle, Colors, ComponentType } from "discord.js";

const exit = (id: number) => [
    {
        type: ComponentType.ActionRow,
        components: [{ type: ComponentType.Button, style: ButtonStyle.Danger, customId: `::giveaway/exit:${id}`, emoji: "⬅️", label: "Withdraw Entry" }],
    },
];

export default async function (button: ButtonInteraction) {
    const giveaway = await trpc.getGiveaway.query({ guild: button.guild!.id, message: button.message.id });

    if (!giveaway) throw "This giveaway appears to no longer exist.";
    if (giveaway.deadline < Date.now()) throw "This giveaway has already ended.";

    const caller = await button.guild!.members.fetch(button.user);

    const count = await countEntries(giveaway, caller);
    const key = { guild: button.guild!.id, id: giveaway.id, user: button.user.id };

    if (await trpc.hasGiveawayEntry.query(key))
        return {
            embeds: [
                {
                    title: "Giveaway Entry",
                    description: `You have already entered the giveaway with **${count} ${count === 1 ? "entry" : "entries"}**. Click below to withdraw.`,
                    color: Colors.Blue,
                },
            ],
            components: exit(giveaway.id),
            ephemeral: true,
        };

    await trpc.addGiveawayEntry.mutate(key);

    return {
        embeds: [
            {
                title: "Giveaway Entry",
                description: `${
                    count === 0
                        ? "You have entered the giveaway but are not eligible and have no entries. Eligibility is calculated immediately before the draw, so if you become eligible later, you'll have a chance to win."
                        : `You have entered the giveaway with **${count} ${
                              count === 1 ? "entry" : "entries"
                          }**. Eligibility is calculated immediately before the draw, so if you gain more entries, you do not need to re-enter the giveaway.`
                } Click below to withdraw.`,
                color: Colors.Green,
            },
        ],
        components: exit(giveaway.id),
        ephemeral: true,
    };
}
