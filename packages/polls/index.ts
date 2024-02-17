import { trpc } from "@daedalus/api";
import { getColor, template } from "@daedalus/bot-utils";
import type { Poll } from "@daedalus/types";
import { ButtonStyle, ComponentType, Guild, type BaseMessageOptions, type ButtonComponentData } from "discord.js";

export async function renderPollFor(message: string, guild: Guild): Promise<BaseMessageOptions> {
    const poll = await trpc.getPoll.query(message);
    if (!poll) return template.error("This poll does not exist in the database. Please contact support.");
    return renderPoll(poll, guild);
}

export async function renderPoll(poll: Poll & { votes: string[] }, guild: Guild): Promise<BaseMessageOptions> {
    const tally: Record<string, number> = {};

    for (const vote of Object.values(poll.votes))
        for (const item of poll.type === "multi" ? (JSON.parse(vote) as string[]) : [vote]) tally[item] = (tally[item] ?? 0) + 1;

    if (poll.type === "yes-no" || poll.type === "binary") {
        let left: number, center: number, right: number;
        const yesno = poll.type === "yes-no";

        if (yesno) {
            ({ yes: left, meh: center, no: right } = tally);
        } else {
            ({ [poll.leftOption]: left, "": center, [poll.rightOption]: right } = tally);
        }

        left ??= 0;
        center ??= 0;
        right ??= 0;

        if (!poll.allowNeutral) center = 0;

        const leftAmount = Math.round((10 * left) / (left + right + center || 1));
        const rightAmount = Math.round((10 * right) / (left + right + center || 1));

        const display = `${(yesno ? "🟩" : "🟦").repeat(leftAmount)}${"⬜".repeat(10 - leftAmount - rightAmount)}${(yesno ? "🟥" : "🟩").repeat(rightAmount)}`;

        return {
            embeds: [
                {
                    title: "Poll",
                    description: poll.question,
                    color: await getColor(guild),
                    fields: [
                        {
                            name: "Results",
                            value: `${yesno ? "⬆️ " : ""}${left} ${display} ${right}${yesno ? " ⬇️" : ""}`,
                        },
                    ],
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: yesno ? ButtonStyle.Success : ButtonStyle.Primary,
                            customId: "::poll/vote:yes",
                            emoji: yesno ? "⬆️" : undefined,
                            label: yesno ? undefined : poll.leftOption,
                        },
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            customId: "::poll/abstain",
                            label: "Clear Vote",
                        },
                        ...((poll.allowNeutral
                            ? [
                                  {
                                      type: ComponentType.Button,
                                      style: ButtonStyle.Secondary,
                                      customId: "::poll/vote:meh",
                                      emoji: "➖",
                                  },
                              ]
                            : []) satisfies ButtonComponentData[]),
                        {
                            type: ComponentType.Button,
                            style: yesno ? ButtonStyle.Danger : ButtonStyle.Success,
                            customId: "::poll/vote:no",
                            emoji: yesno ? "⬇️" : undefined,
                            label: yesno ? undefined : poll.rightOption,
                        },
                    ],
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            customId: "::poll/close",
                            label: "Close",
                        },
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            customId: "::poll/edit",
                            label: "Edit",
                        },
                    ],
                },
            ],
        };
    } else if (poll.type === "multi") {
        const count = Object.values(poll.votes).filter((vote) => (JSON.parse(vote) as string[]).some((x) => poll.options.includes(x))).length;

        return {
            embeds: [
                {
                    title: "Poll",
                    description: poll.question,
                    color: await getColor(guild),
                    fields: [
                        {
                            name: "Results",
                            value: poll.options
                                .map(
                                    (option: string) =>
                                        `${option} - ${tally[option] ?? 0} / ${count} (${(((tally[option] ?? 0) / (count || 1)) * 100).toFixed(2)}%)`,
                                )
                                .join("\n"),
                        },
                    ],
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.StringSelect,
                            customId: "::poll/vote",
                            options: poll.options.map((option: string, index: number) => ({
                                label: option,
                                value: option,
                                emoji: ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"][index],
                            })),
                            minValues: poll.allowMulti ? 0 : 1,
                            maxValues: poll.allowMulti ? poll.options.length : 1,
                        },
                    ],
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            customId: "::poll/abstain",
                            label: "Clear Vote",
                        },
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            customId: "::poll/close",
                            label: "Close",
                        },
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            customId: "::poll/edit",
                            label: "Edit",
                        },
                    ],
                },
            ],
        };
    }

    return {};
}
