import { trpc } from "@daedalus/api";
import { SpoilerLevel, copyMedia, embed, expand, getColor, isModuleDisabled, isWrongClient, mdash, obtainLimit, template } from "@daedalus/bot-utils";
import { secrets } from "@daedalus/config";
import { formatCustomMessageString } from "@daedalus/custom-messages";
import { logError } from "@daedalus/log-interface";
import {
    Attachment,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    Client,
    Colors,
    ComponentType,
    Message,
    TextInputStyle,
    ThreadAutoArchiveDuration,
    escapeMarkdown,
    type APIEmbed,
    type ActionRowData,
    type ButtonComponentData,
    type ButtonInteraction,
    type Guild,
    type GuildMember,
    type GuildTextBasedChannel,
    type InteractionReplyOptions,
    type MessageActionRowComponentData,
    type MessageComponentInteraction,
    type MessageCreateOptions,
    type ModalMessageModalSubmitInteraction,
    type ModalSubmitInteraction,
    type StringSelectMenuComponentData,
    type User,
} from "discord.js";

export async function modmailReply(
    source: Message | MessageComponentInteraction | ModalMessageModalSubmitInteraction,
    message: Promise<MessageCreateOptions | null>,
) {
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
    if (guilds.length === 1) return await modmailTargetSelector(guilds[0], false);

    guilds.sort((x, y) => x.name.localeCompare(y.name));

    return {
        embeds: [
            {
                title: "Modmail Menu: Select Server",
                description: "Select the server that you would like to contact.",
                color: 0x009688,
                footer:
                    guilds.length > 100
                        ? {
                              text: "Because you are in more than 100 servers with modmail, which exceeds the number of options the bot can give you in a dropdown, you must enter the ID using the button below.",
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
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        customId: multiGuild ? "::modmail/switch-guild" : "::modmail/switch-target",
                        label: multiGuild ? "Select another guild" : "Select another target",
                    },
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

export async function sendModmail(interaction: MessageComponentInteraction | ModalMessageModalSubmitInteraction, guildId: string, targetId: number) {
    const color = await getColor(guildId);

    await interaction.update({
        embeds: [
            {
                title: "Your message is being processed...",
                description: "Please be patient; this may take a few seconds.",
                color,
            },
        ],
        components: [],
    });

    try {
        const message = await interaction.message.fetchReference().catch((error) => {
            console.error(error);
            throw "Your message could not be fetched. If you did not delete it before confirming your modmail target, please contact support.";
        });

        const guild = await interaction.client.guilds.fetch(guildId).catch(() => {
            throw `Could not fetch the guild with ID \`${guildId}\`. The bot may have been removed from this guild. If not and this issue persists, please contact support.`;
        });

        if (await isWrongClient(guild.client, guild))
            throw `This is not the correct modmail bot for **${escapeMarkdown(guild.name)}** (it was changed after your message). Please find the client that that guild is using.`;

        if (await isModuleDisabled(guild, "modmail"))
            throw `**${escapeMarkdown(guild.name)}** does not have modmail enabled (it was disabled after your message).`;

        const targets = await trpc.getModmailTargets.query(guild.id);
        const limit = (await obtainLimit(guild.id, "multiModmail")) ? ((await obtainLimit(guild.id, "modmailTargetCountLimit")) as number) : 1;
        const target = targets.slice(0, limit).find((target) => target.id === targetId);

        if (!target)
            throw `That modmail target no longer exists (**${escapeMarkdown(guild.name)}**'s configuration changed after your message). Please send your message again to try again.`;

        const existingThread = await trpc.getExistingThread.query({ guild: guildId, target: targetId, user: message.author.id });

        let channel: GuildTextBasedChannel | null =
            existingThread === null ? null : ((await guild.channels.fetch(existingThread.channel).catch(() => null)) as GuildTextBasedChannel | null);

        let created = false;

        if (!channel) {
            created = true;

            if (target.useThreads) {
                if (!target.channel) {
                    logError(
                        guild.id,
                        "Creating modmail thread",
                        `Invalid configuration: the root channel for target \"${escapeMarkdown(target.name)}\" is not set.`,
                    );

                    throw `Invalid configuration: **${escapeMarkdown(guild.name)}** did not configure the root channel for this target. Please report this to the server's staff.`;
                }

                const root = await guild.channels.fetch(target.channel).catch(() => {
                    logError(
                        guild.id,
                        "Creating modmail thread",
                        `Invalid configuration: the root channel for the target \"${escapeMarkdown(target.name)}\", <#${target.channel}>, could not be fetched ${mdash} check the bot's permissions.`,
                    );

                    throw `Invalid configuration: the modmail channel could not be fetched. Please report this to the server's staff.`;
                });

                if (!root || (root.type !== ChannelType.GuildText && root.type !== ChannelType.GuildAnnouncement)) {
                    logError(
                        guild.id,
                        "Creating modmail thread",
                        `Invalid configuration: the target \"${escapeMarkdown(target.name)}\" is configured to use threads, but the specified parent channel does not allow thread creation.`,
                    );

                    throw `Invalid configuration: **${escapeMarkdown(guild.name)}** is configured to use threads for modmail, but the parent channel does not allow thread creation. Please report this to the server's staff.`;
                } else {
                    const startMessage = await root.send(embed("New Modmail Thread", `This modmail thread is with ${message.author}.`, color)).catch(() => {
                        logError(
                            guild.id,
                            "Creating modmail thread",
                            `Could not post a message to ${root}, which is required to start a modmail thread ${mdash} check the bot's permissions.`,
                        );

                        throw "The bot was not able to create a message in the modmail channel to start your thread. Please report this to the server's staff.";
                    });

                    channel = await startMessage.startThread({ name: message.author.tag, autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek }).catch(() => {
                        logError(
                            guild.id,
                            "Creating modmail thread",
                            `Could not start a thread under ${startMessage.url} ${mdash} check the bot's permissions.`,
                        );

                        throw "The bot was not able to start a thread in the modmail channel. Please report this to the server's staff.";
                    });
                }
            } else {
                if (!target.category) {
                    logError(
                        guild.id,
                        "Creating modmail thread",
                        `Invalid configuration: the root category for target \"${escapeMarkdown(target.name)}\" is not set.`,
                    );

                    throw `Invalid configuration: **${escapeMarkdown(guild.name)}** did not configure the root category for this target. Please report this to the server's staff.`;
                }

                const root = await guild.channels.fetch(target.category).catch(() => {
                    logError(
                        guild.id,
                        "Creating modmail thread",
                        `Invalid configuration: the root category for the target \"${escapeMarkdown(target.name)}\", <#${target.category}>, could not be fetched ${mdash} check the bot's permissions.`,
                    );

                    throw `Invalid configuration: the modmail category could not be fetched. Please report this to the server's staff.`;
                });

                if (!root || root.type !== ChannelType.GuildCategory) {
                    logError(
                        guild.id,
                        "Creating modmail thread",
                        `Invalid configuration: the target \"${escapeMarkdown(target.name)}\" is configured to use regular text channels, but the specified parent channel is not a category.`,
                    );

                    throw `Invalid configuration: **${escapeMarkdown(guild.name)}** is configured to use regular text channels for modmail, but the parent channel is not a category. Please report this to the server's staff.`;
                }

                channel =
                    root.children.cache.size >= 50
                        ? await root.guild.channels.create({ name: message.author.tag, permissionOverwrites: root.permissionOverwrites.cache }).catch(() => {
                              logError(
                                  guild.id,
                                  "Creating modmail thread",
                                  `Could not create a channel in the guild (your modmail category, ${root.name}, is overflowing) ${mdash} check the bot's permissions.`,
                              );

                              throw "The bot was not able to start a channel for your modmail thread. Please report this to the server's staff.";
                          })
                        : await root.children.create({ name: message.author.tag }).catch(() => {
                              logError(guild.id, "Creating modmail thread", `Could not create a channel in ${root.name} ${mdash} check the bot's permissions.`);
                              throw "The bot was not able to start a channel for your modmail thread. Please report this to the server's staff.";
                          });

                if (target.channel) {
                    const log = await guild.channels
                        .fetch(target.channel)
                        .catch(() =>
                            logError(
                                guild.id,
                                "Posting modmail log entry",
                                `Could not fetch <#${target.channel}> to post a modmail log entry ${mdash} check the bot's permissions.`,
                            ),
                        );

                    if (!log?.isTextBased())
                        logError(
                            guild.id,
                            "Posting modmail log entry",
                            `Somehow, ${log} is not text-based and a modmail log entry cannot be posted ${mdash} contact support if you believe this is a bug.`,
                        );
                    else
                        await log
                            .send(embed("New Modmail Thread", `A modmail thread was just opened with ${message.author}: ${channel}.`, Colors.Green))
                            .catch(() =>
                                logError(
                                    guild.id,
                                    "Posting modmail log entry",
                                    `Could not post a modmail log entry to ${log} ${mdash} check the bot's permissions.`,
                                ),
                            );
                }
            }
        }

        if (created)
            await trpc.createModmailThread.mutate({
                guild: guild.id,
                user: message.author.id,
                targetId: target.id,
                targetName: target.name,
                channel: channel.id,
            });
        else if (existingThread?.closed)
            await trpc.reviveModmailThread.mutate({ uuid: existingThread.uuid, channel: channel.id, user: message.author.id, targetName: target.name });

        if (existingThread?.closed ?? true)
            await channel
                .send({
                    content: `${target.pingHere ? "@here" : ""} ${target.pingRoles.map((x) => `<@&${x}>`).join(" ")}`,
                    embeds: [{ title: "Modmail Thread Opened", description: `This modmail thread was just opened by ${message.author}.`, color }],
                    allowedMentions: { parse: target.pingHere ? ["everyone"] : [], roles: target.pingRoles },
                })
                .catch(() =>
                    logError(
                        guild.id,
                        "Posting modmail alert",
                        `An error occurred trying to post a modmail alert in ${channel} ${mdash} check the bot's permissions.`,
                    ),
                );

        const pings = await trpc.getAndUpdateModmailNotifications.mutate(channel.id);

        const contents = pings.length > 0 ? [`<@${pings.shift()}>`] : [];

        for (const ping of pings)
            if (contents.at(-1)!.length + ping.length + 4 <= 2000) contents[contents.length - 1] += `<@${ping}>`;
            else contents.push(`<@${ping}>`);

        for (const content of contents.slice(0, -1)) await channel.send({ content, allowedMentions: { parse: ["users"] } }).catch(() => null);

        await channel
            .send({
                content: contents.at(-1),
                embeds: [
                    {
                        title: "Incoming Message",
                        description: message.content,
                        author: { name: message.author.tag, icon_url: message.author.displayAvatarURL({ size: 256 }) },
                        timestamp: new Date().toISOString(),
                        color,
                        footer: { text: message.url },
                    },
                ],
                files: await copyMedia(message, SpoilerLevel.HIDE),
                allowedMentions: { parse: ["users"] },
            })
            .catch(() => {
                logError(
                    guild.id,
                    "Posting modmail message",
                    `An error occurred trying to post an incoming modmail message in ${channel}. Please check the bot's permissions and contact support if this issue persists and you believe it is not a configuration error.`,
                );

                throw "Your modmail message could not be sent. Everything else (loading/creating your thread) worked fine. Please report this to the server's staff.";
            });

        await trpc.cancelModmailAutoclose.mutate(channel.id);
        await trpc.postIncomingModmailMessage.mutate({ channel: channel.id, content: message.content, attachments: message.attachments.toJSON() });

        await interaction.editReply({
            embeds: [
                {
                    title: `Message sent to **${escapeMarkdown(guild.name)}**`,
                    description:
                        existingThread?.closed ?? true
                            ? (await formatCustomMessageString(target.openParsed, { guild, user: message.author }).catch((error) =>
                                  logError(
                                      guild.id,
                                      "Formatting modmail on-open message",
                                      `An unexpected error occurred formatting your custom on-open message for modmail:\n\`\`\`\n${error}\n\`\`\``,
                                  ),
                              )) || `Thank you for contacting ${escapeMarkdown(guild.name)}'s staff! We will get back to you shortly.`
                            : undefined,
                    color,
                },
            ],
            components: [],
        });

        await message.react("✅");
    } catch (error) {
        if (typeof error === "string") await interaction.editReply(template.error(error));
        else {
            const id = crypto.randomUUID();
            console.error(`${id}`, error);

            await interaction.editReply(
                template.error(
                    `An unexpected error occurred. We sincerely apologize for this issue. Please contact support if this issue persists. This error has ID \`${id}\`.`,
                ),
            );
        }
    }
}

export function getModmailContactInfo<P extends boolean>(permitAbsent: P) {
    return async function <T extends { _: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction | GuildTextBasedChannel }>(
        data: T,
    ): Promise<
        T & {
            member: P extends true ? GuildMember | undefined : GuildMember;
            thread: Exclude<Awaited<ReturnType<typeof trpc.getModmailThreadByChannel.query>>, null>;
        }
    > {
        const { _ } = data;
        const channel = "channel" in _ ? _.channel! : _;

        const thread = await trpc.getModmailThreadByChannel.query(channel.id);
        if (!thread) throw "This is not a modmail thread.";
        if (thread.closed) throw "This thread is closed.";

        const member = await _.guild!.members.fetch(thread.user).catch(() => {});
        if (!member && !permitAbsent) throw "The recipient does not appear to be in this server anymore.";

        return { ...data, member: member as any, thread };
    };
}

export async function handleReply(
    _: ChatInputCommandInteraction | ModalSubmitInteraction,
    caller: GuildMember,
    member: GuildMember,
    anon: boolean,
    content: string | undefined,
    filemap: Record<string, Attachment | null>,
): Promise<InteractionReplyOptions> {
    const files = Object.values(filemap)
        .filter((x) => x)
        .map((x) => ({ name: x!.name, attachment: x!.url }));

    if (!content && files.length === 0) throw "You must either include content or at least one file.";

    const data: APIEmbed = {
        description: content ?? undefined,
        author: { name: anon ? "Anonymous Message" : _.user.tag, icon_url: anon ? undefined : caller.displayAvatarURL({ size: 256 }) },
        timestamp: new Date().toISOString(),
        color: await getColor(_.guild!),
        footer: anon ? undefined : { text: caller.roles.highest?.name },
    };

    let output: Message;

    try {
        output = await member.send({ embeds: [{ title: `Incoming Staff Message from ${_.guild!.name}`, ...data }], files });
    } catch {
        throw "The message could not be sent. They may have DMs off or have blocked the bot, or a different issue occurred.";
    }

    await trpc.cancelModmailAutoclose.mutate(_.channel!.id);

    const source = `${Date.now()}~${Math.random()}`.slice(0, 36);

    await trpc.postOutgoingModmailMessage.mutate({
        channel: _.channel!.id,
        id: output.id,
        source,
        author: _.user.id,
        anon,
        content: content || "",
        attachments: output.attachments.toJSON(),
    });

    return {
        embeds: [{ title: "Outgoing Message", ...data }],
        files,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        customId: `:${_.user.id}:modmail/edit-message:${source}`,
                        emoji: "✏️",
                        label: "Edit",
                    },
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Danger,
                        customId: `:${_.user.id}:modmail/delete-message:${source}`,
                        emoji: "🗑️",
                        label: "Delete",
                    },
                ],
            },
        ],
    };
}

export async function startModal(
    _: ChatInputCommandInteraction,
    caller: GuildMember,
    member: GuildMember,
    anon: boolean,
    content: string | undefined,
    filemap: Record<string, Attachment | null>,
) {
    await _.showModal({
        title: "Modmail Response",
        customId: "-",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "content",
                        label: "Content",
                        value: content,
                        maxLength: 2000,
                        required: true,
                        placeholder: "You have 30 minutes to submit your response.",
                    },
                ],
            },
        ],
    });

    const modal = await _.awaitModalSubmit({ time: 1800000 }).catch(() => {});
    if (!modal) return;

    content = modal.fields.getTextInputValue("content");
    await modal.deferReply();

    try {
        await modal.editReply(await handleReply(_, caller, member, anon, content, filemap));
    } catch (error) {
        await modal.editReply(template.error(`${error}`));
    }
}

export async function closeModmailThread(ctx: ChatInputCommandInteraction | GuildTextBasedChannel, user: string, notify: boolean, content: string) {
    const send = ctx instanceof ChatInputCommandInteraction ? ctx.editReply.bind(ctx) : ctx.send.bind(ctx);
    const channel = ctx instanceof ChatInputCommandInteraction ? ctx.channel! : ctx;

    const { member, thread } = await getModmailContactInfo(!notify)({ _: ctx });

    const targets = await trpc.getModmailTargets.query(ctx.guild!.id);
    const target = targets.find((target) => target.id === thread.targetId);

    if (member && notify) {
        content ||= target
            ? await formatCustomMessageString(target.closeParsed, { guild: ctx.guild, member }).catch((error) => {
                  logError(
                      ctx.guild!.id,
                      "Formatting modmail on-close message",
                      `An unexpected error occurred formatting your custom on-close message for modmail:\n\`\`\`\n${error}\n\`\`\``,
                  );

                  return "";
              })
            : "";

        try {
            await member.send({
                embeds: [
                    {
                        title: `Modmail Thread Closed: **${escapeMarkdown(ctx.guild!.name)}**`,
                        description: content,
                        color: await getColor(ctx.guild!),
                        footer: { text: `Server ID: ${ctx.guild!.id}` },
                    },
                ],
            });
        } catch (error) {
            console.error(error);
            await send(template.error("The user could not be notified. They may have disabled DMs or blocked the bot."));
            return;
        }
    }

    await trpc.closeModmailThread.mutate({ channel: channel.id, author: user, content, sent: notify });

    setTimeout(() => (channel.isThread() ? channel.setArchived(true) : channel.delete()), 2500);

    const log = !target || target.channel === null ? null : await ctx.guild!.channels.fetch(target.channel).catch(() => null);

    if (log?.isTextBased())
        await log.send({
            embeds: [
                {
                    title: "Modmail Thread Closed",
                    description: `The thread with ${expand(member, `Missing Member: <@${thread.user}>`)} was closed.`,
                    color: Colors.Red,
                },
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            label: "View on Dashboard",
                            url: `${secrets.DOMAIN}/modmail/${thread.uuid}`,
                        },
                    ],
                },
            ],
        });

    await send({
        embeds: [
            {
                title: "Modmail Thread Closed",
                description: notify ? "The recipient was notified." : "No notification was sent.",
                color: await getColor(ctx.guild!),
            },
        ],
    });
}
