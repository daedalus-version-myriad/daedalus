import { trpc } from "@daedalus/api";
import { getColor, template } from "@daedalus/bot-utils";
import {
    ButtonStyle,
    Client,
    Colors,
    ComponentType,
    Message,
    ModalSubmitInteraction,
    escapeMarkdown,
    type ActionRowData,
    type ButtonComponentData,
    type Guild,
    type MessageActionRowComponentData,
    type MessageComponentInteraction,
    type MessageCreateOptions,
    type StringSelectMenuComponentData,
    type User,
} from "discord.js";

export async function modmailReply(source: Message | MessageComponentInteraction | ModalSubmitInteraction, message: Promise<MessageCreateOptions | null>) {
    if (source instanceof Message) {
        const data = await message;
        if (data) await source.reply(data);
    } else {
        if (!source.deferred && !source.replied) await source.deferUpdate();
        const data = await message;
        if (data) await source.editReply(data);
        else
            await source.editReply({
                embeds: [
                    {
                        title: "Unexpected issue",
                        description:
                            "The modmail handler unexpectedly quit. Please report this to support if this issue persists and you cannot contact the server you are trying to reach.",
                        color: Colors.Red,
                    },
                ],
            });
    }
}

export async function modmailGuildSelector(user: User): Promise<MessageCreateOptions | null> {
    const guilds: Guild[] = [];

    for (const id of await trpc.getModmailEnabledNonVanityGuilds.query()) {
        const guild = await user.client.guilds.fetch(id).catch(() => null);
        if (!guild) continue;

        try {
            await guild.members.fetch({ user, force: true });
            guilds.push(guild);
        } catch {}
    }

    if (guilds.length === 0) return null;
    // if (guilds.length === 1) return await modmailTargetSelector(guilds[0], false);

    return {
        embeds: [
            {
                title: "Modmail Menu: Select Server",
                description: "Select the server that you would like to contact.",
                color: 0x009688,
                footer:
                    guilds.length > 100
                        ? {
                              text: "Since you are in more than 100 servers with modmail, which exceeds the number of options the bot can give you in a dropdown, you must enter the ID using the button below.",
                          }
                        : undefined,
            },
        ],
        components:
            guilds.length > 100
                ? [
                      {
                          type: ComponentType.ActionRow,
                          components: [
                              {
                                  type: ComponentType.Button,
                                  style: ButtonStyle.Primary,
                                  customId: "::modmail/input-id",
                                  label: "Enter Server ID",
                              },
                              {
                                  type: ComponentType.Button,
                                  style: ButtonStyle.Danger,
                                  customId: "::cancel",
                                  label: "Cancel",
                              },
                          ],
                      },
                  ]
                : [0, 25, 50, 75]
                      .flatMap<ActionRowData<MessageActionRowComponentData>>((x) =>
                          guilds.length >= x
                              ? [
                                    {
                                        type: ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: ComponentType.StringSelect,
                                                customId: `::modmail/select-guild:${x}`,
                                                placeholder: "Select a server to contact.",
                                                options: guilds
                                                    .slice(x, x + 25)
                                                    .map((guild, index) => ({ label: `${index + x + 1}. ${guild.name}`.slice(0, 100), value: guild.id })),
                                            },
                                        ],
                                    },
                                ]
                              : [],
                      )
                      .concat({
                          type: ComponentType.ActionRow,
                          components: [{ type: ComponentType.Button, style: ButtonStyle.Danger, customId: "::cancel", label: "Cancel" }],
                      }),
    };
}

export async function modmailTargetSelector(guild: Guild, allowReturn: boolean): Promise<MessageCreateOptions | null> {
    const targets = await trpc.getModmailTargets.query(guild.id);

    if (targets.length === 0)
        return template.error(
            `**${escapeMarkdown(guild.name)}** has enabled the modmail module but has not set it up yet. Please contact the server's staff via another method if this issue persists.`,
        );

    if (targets.length === 1)
        return {
            embeds: [
                {
                    title: "Modmail Menu: Confirm",
                    description: `Do you want to send your message to **${escapeMarkdown(guild.name)}**?`,
                    color: await getColor(guild),
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Success,
                            customId: `::modmail/confirm:${guild.id}:${targets[0].id}`,
                            label: "Send",
                        },
                        ...(allowReturn
                            ? [
                                  {
                                      type: ComponentType.Button,
                                      style: ButtonStyle.Secondary,
                                      customId: `::modmail/switch-guild`,
                                      label: "Switch Server",
                                  } satisfies ButtonComponentData,
                              ]
                            : []),
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Danger,
                            customId: `::cancel`,
                            label: "Cancel",
                        },
                    ],
                },
            ],
        };

    return {
        embeds: [
            {
                title: "Modmail Menu: Select Target",
                description: `Select the target within **${escapeMarkdown(guild.name)}** to which you want to send your message.`,
                color: await getColor(guild),
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        customId: `::modmail/select-target:${guild.id}`,
                        placeholder: "Select a target to contact.",
                        options: targets.map((target) => ({
                            value: `${target.id}`,
                            label: target.name,
                            description: target.description,
                            emoji: target.emoji ?? undefined,
                        })),
                    },
                ],
            },

            {
                type: ComponentType.ActionRow,
                components: [
                    ...(allowReturn
                        ? [
                              {
                                  type: ComponentType.Button,
                                  style: ButtonStyle.Secondary,
                                  customId: `::modmail/switch-guild`,
                                  label: "Switch Server",
                              } satisfies ButtonComponentData,
                          ]
                        : []),
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Danger,
                        customId: "::cancel",
                        label: "Cancel",
                    },
                ],
            },
        ],
    };
}

export async function modmailResendConfirmation(guild: Guild, target: number, multiGuild: boolean): Promise<MessageCreateOptions | null> {
    const targets = await trpc.getModmailTargets.query(guild.id);

    const noOthers = targets.length === 1 && targets[0].id === target;

    return {
        embeds: [
            {
                title: "Modmail Menu: Confirm",
                description: `You have an open thread with${noOthers ? "" : ` **${escapeMarkdown(targets.find((t) => t.id === target)?.name ?? "(unknown target)")}** in`} **${escapeMarkdown(guild.name)}**. Do you want to send your message there again?`,
                color: await getColor(guild),
                footer: noOthers ? undefined : { text: `You can also select another target in ${guild.name}.` },
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Success,
                        customId: `::modmail/confirm:${guild.id}:${target}`,
                        label: "Send",
                    },
                    ...(multiGuild
                        ? [
                              {
                                  type: ComponentType.Button,
                                  style: ButtonStyle.Secondary,
                                  customId: `::modmail/switch-guild`,
                                  label: "Switch Server",
                              } satisfies ButtonComponentData,
                          ]
                        : []),
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Danger,
                        customId: "::cancel",
                        label: "Cancel",
                    },
                ],
            },
            ...(noOthers
                ? []
                : [
                      {
                          type: ComponentType.ActionRow,
                          components: [
                              {
                                  type: ComponentType.StringSelect,
                                  customId: `::modmail/select-target:${guild.id}`,
                                  placeholder: "Select another target to contact.",
                                  options: targets
                                      .filter(({ id }) => id !== target)
                                      .map((target) => ({
                                          value: `${target.id}`,
                                          label: target.name,
                                          description: target.description,
                                          emoji: target.emoji ?? undefined,
                                      })),
                              } satisfies StringSelectMenuComponentData,
                          ],
                      },
                  ]),
        ],
    };
}

export async function modmailMultiResendConfirmation(
    client: Client,
    threads: { guild: string; targetId: number }[],
    multiGuild: boolean,
): Promise<MessageCreateOptions | null> {
    const targets = new Map<string, Record<number, [string, string | null]>>();

    for (const { guild } of threads.slice(0, 25)) {
        if (targets.has(guild)) continue;
        targets.set(guild, Object.fromEntries((await trpc.getModmailTargets.query(guild)).map((target) => [target.id, [target.name, target.emoji]])));
    }

    return {
        embeds: [
            {
                title: "Modmail Menu: Select Thread",
                description: `You have multiple open modmail threads. Select one to send your message there. ${threads.length > 25 ? "(you have more than 25 open threads which exceeds the amount that can be shown; you will need to select another one manually to contact it.)" : ""}`,
                color: multiGuild ? 0x009688 : await getColor(threads[0].guild),
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        customId: "::modmail/select-thread",
                        placeholder: "Select a thread to contact.",
                        options: threads.slice(0, 25).map(({ guild, targetId }) => ({
                            value: `${guild}/${targetId}`,
                            label: (client.guilds.cache.get(guild)?.name ?? "(unknown guild)").slice(0, 100),
                            description: targets.get(guild)?.[targetId]?.[0] ?? "(unknown target)",
                            emoji: targets.get(guild)?.[targetId]?.[1] ?? undefined,
                        })),
                    },
                ],
            },
        ],
    };
}
