import { trpc } from "@daedalus/api";
import { getColor, isModuleDisabled, isWrongClient, obtainLimit, template } from "@daedalus/bot-utils";
import { secrets } from "@daedalus/config";
import { formatMessage } from "@daedalus/custom-messages";
import { logError } from "@daedalus/log-interface";
import {
    ButtonStyle,
    ChannelType,
    ComponentType,
    OverwriteType,
    PermissionFlagsBits,
    type ButtonInteraction,
    type StringSelectMenuInteraction,
} from "discord.js";

export default async function (interaction: ButtonInteraction | StringSelectMenuInteraction, id: string) {
    await interaction.deferReply({ ephemeral: true });

    if (await isWrongClient(interaction.client, interaction.guild!))
        throw 'This server is no longer using this client. Ticket prompts need to be set up again, which can be done by simply clicking "save" on the dashboard.';

    if (await isModuleDisabled(interaction.guild!, "tickets")) throw "The Tickets module is disabled.";

    const config = await trpc.getTicketsConfig.query(interaction.guild!.id);

    const prompt = config.prompts
        .slice(0, (await obtainLimit(interaction.guild!.id, "ticketPromptCountLimit")) as number)
        .find((prompt) => prompt.message === interaction.message.id);

    if (!prompt) return;
    if (prompt.error) throw "This ticket prompt is out of sync due to an error with its last save. Server management can fix this on the dashboard.";

    const canUseMulti = (await obtainLimit(interaction.guild!.id, "multiTickets")) as boolean;

    if (interaction.isStringSelectMenu()) {
        if (!canUseMulti) throw "This is a premium-only feature, but this server no longer has access to it.";
        id = interaction.values[0];
    }

    const target = prompt.useMulti
        ? prompt.targets
              .filter((x) => !!x.channel && !!x.category)
              .slice(0, (await obtainLimit(interaction.guild!.id, "ticketTargetCountLimit")) as number)
              .find((x) => `${x.id}` === id)
        : `${prompt.targets[0].id}` === id
          ? prompt.targets[0]
          : null;

    if (!target) throw "Could not find the referenced ticket target. Please contact Daedalus support (not the server's staff) if this issue persists.";

    const log = await interaction.guild!.channels.fetch(target.channel!).catch(() => {
        throw "Could not fetch the ticket log channel. Please contact server staff if this issue persists.";
    });

    const category = await interaction.guild!.channels.fetch(target.category!).catch(() => {
        throw "Could not fetch the ticket category channel. Please contact server staff if this issue persists.";
    });

    if (!log?.isTextBased() || category?.type !== ChannelType.GuildCategory) throw "Invalid channel type(s). Please contact support if this issue persists.";

    const existing = await trpc.getExistingTicket.query({
        guild: interaction.guild!.id,
        user: interaction.user.id,
        prompt: prompt.id,
        target: target.id,
    });

    if (existing)
        if (interaction.guild!.channels.cache.has(existing.channel)) return template.info(`You already have an open ticket at <#${existing.channel}>.`);
        else await trpc.markTicketAsClosed.mutate(existing.uuid);

    const channel = await category.children.create({
        name: interaction.user.tag,
        permissionOverwrites: [
            ...category.permissionOverwrites.cache.toJSON(),
            ...(category.permissionOverwrites.cache.has(interaction.user.id)
                ? []
                : [{ type: OverwriteType.Member, id: interaction.user.id, allow: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages }]),
        ],
    });

    const uuid = await trpc.openTicket.mutate({
        guild: interaction.guild!.id,
        user: interaction.user.id,
        prompt: prompt.id,
        target: target.id,
        author: interaction.user.id,
        channel: channel.id,
    });

    let content = "";
    if (target.pingHere) content = "@here ";
    for (const role of target.pingRoles) if (interaction.guild!.roles.cache.has(role)) content += `<@&${role}> `;
    content += `${interaction.user} `;

    let posted = false;

    if ((await obtainLimit(interaction.guild!.id, "customizeTicketOpenMessage")) && target.postCustomOpenMessage)
        try {
            const data = await formatMessage(target.customOpenParsed, {
                guild: interaction.guild,
                member: await interaction.guild!.members.fetch(interaction.user),
            });

            await channel.send({
                ...data,
                content: `${content}${data.content ?? ""}`.slice(0, 2000),
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            { type: ComponentType.Button, style: ButtonStyle.Link, label: "View on Dashboard", url: `${secrets.DOMAIN}/ticket/${uuid}` },
                        ],
                    },
                ],
                allowedMentions: { parse: ["everyone", "roles", "users"] },
            });

            posted = true;
        } catch (error) {
            logError(interaction.guild!.id, "Posting ticket on-open message", `Error posting custom on-open message in ${channel}:\n\`\`\`\n${error}\n\`\`\``);
        }

    if (!posted)
        await channel
            .send({
                content,
                embeds: [
                    {
                        title: "New Ticket",
                        description: `Your ticket was created, ${interaction.user}. Please enter your inquiry below and wait for staff to address this ticket.`,
                        color: await getColor(interaction.guild!),
                    },
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            { type: ComponentType.Button, style: ButtonStyle.Link, label: "View on Dashboard", url: `${secrets.DOMAIN}/ticket/${uuid}` },
                        ],
                    },
                ],
                allowedMentions: { parse: ["everyone", "roles", "users"] },
            })
            .catch(() => {});

    await log
        .send({
            embeds: [
                {
                    title: "Ticket Created",
                    description: `A ticket was opened with ${interaction.user}: ${channel}.`,
                    color: await getColor(interaction.guild!),
                },
            ],
        })
        .catch(() => {});

    return template.success(`Your ticket has been created: ${channel}.`);
}
