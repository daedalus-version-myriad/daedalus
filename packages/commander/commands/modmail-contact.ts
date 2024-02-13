import { trpc } from "@daedalus/api";
import { checkPermissions, defer, embed, getColor, template, type Commands } from "@daedalus/bot-utils";
import { logError } from "@daedalus/log-interface";
import type { GuildModmailSettings } from "@daedalus/types";
import { ChannelType, Colors, ComponentType, ThreadAutoArchiveDuration, ThreadChannel, type TextBasedChannel } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail contact")
            .description("open a modmail thread with a member (they will not be informed until a message is sent)")
            .userOption("user", "the user to contact", { required: true })
            .fn(defer(true))
            .fn(async ({ _, user }) => {
                if (user.bot) throw "Bots cannot DM each other. You cannot use modmail to contact a bot.";

                await _.guild!.members.fetch({ user, force: true }).catch(() => {
                    throw `${user} is not in this server.`;
                });

                const unfiltered = (await trpc.getModmailTargets.query(_.guild!.id)).filter(
                    (target) => target.channel && (target.useThreads || !!target.category),
                );

                const targets: GuildModmailSettings["targets"] = [];

                for (const target of unfiltered) {
                    const channel = await _.guild!.channels.fetch(target.channel!).catch(() => null);
                    if (!channel) continue;
                    if (await checkPermissions(_.user, "modmail", channel)) continue;

                    targets.push(target);
                }

                if (targets.length === 0)
                    throw "You do not have permission to do this in any modmail targets or this server's modmail configuration is invalid or incomplete.";

                const color = await getColor(_.guild!);

                let target: GuildModmailSettings["targets"][number];

                if (targets.length === 1) target = targets[0];
                else {
                    const reply = await _.editReply({
                        embeds: [
                            {
                                title: "**Select Modmail Target**",
                                description: "Please select the target in which to open this modmail thread. You have 2 minutes to decide.",
                                color,
                            },
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.StringSelect,
                                        customId: "target-selection",
                                        options: targets.map((x) => ({
                                            label: x.name,
                                            description: x.description || undefined,
                                            emoji: x.emoji ?? undefined,
                                            value: `${x.id}`,
                                        })),
                                    },
                                ],
                            },
                        ],
                    });

                    try {
                        const response = await reply.awaitMessageComponent({ componentType: ComponentType.StringSelect, time: 120000 });

                        target = targets.find((x) => `${x.id}` === response.values[0])!;

                        if (!target) {
                            await reply.edit(
                                template.error(
                                    "An unexpected error occurred (selected target is invalid). This appears to be our fault; please contact support if this issue persists.",
                                ),
                            );

                            return;
                        }
                    } catch {
                        await reply.edit(template.error("This action timed out."));
                        return;
                    }
                }

                const entry = await trpc.getExistingThread.query({ guild: _.guild!.id, user: user.id, target: target.id });
                const fetched = entry && (await _.guild!.channels.fetch(entry.channel).catch(() => null));

                if (!(entry?.closed ?? true) && fetched?.isTextBased()) {
                    await _.editReply(template.error(`This user already has an open modmail thread: ${fetched}.`));
                    return;
                }

                if (fetched && !fetched!.isTextBased()) throw "Invalid channel type. This error should never occur.";

                let channel: TextBasedChannel | ThreadChannel | null = fetched;

                if (channel && (entry?.closed ?? true) && target.useThreads !== channel.isThread()) channel = null;

                if (!channel)
                    if (target.useThreads) {
                        let error: any;
                        const root = await _.guild!.channels.fetch(target.channel!).catch((e) => void _.editReply(template.error((error = e))));
                        if (error) return;

                        if (!root || !("threads" in root)) {
                            await _.editReply(template.error("Invalid channel: root channel does not exist or cannot contain threads."));
                            return;
                        } else
                            channel = await root.threads
                                .create({
                                    name: user.tag,
                                    message: embed("New Modmail Thread", `This modmail thread is with ${user}.`, color),
                                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                                })
                                .catch((e) => (_.editReply(template.error(`${e}`)), null));
                    } else {
                        let error: any;
                        const root = await _.guild!.channels.fetch(target.category!).catch((e) => void _.editReply(template.error((error = e))));
                        if (error) return;

                        if (root?.type !== ChannelType.GuildCategory)
                            return void (await _.editReply(template.error("Invalid channel: root channel does not exist or is not a category.")));
                        else
                            channel =
                                root.children.cache.size >= 50
                                    ? await root.guild.channels
                                          .create({ name: user.tag, permissionOverwrites: root.permissionOverwrites.cache })
                                          .catch((e) => (_.editReply(template.error(`${e}`)), null))
                                    : await root.children.create({ name: user.tag }).catch((e) => (_.editReply(template.error(`${e}`)), null));
                    }

                if (!channel) return;

                if (!target.useThreads) {
                    try {
                        const log = await _.guild!.channels.fetch(target.channel!);

                        if (!log) throw `Log channel (${target.channel}) does not exist or cannot be seen by the bot.`;
                        if (!log?.isTextBased()) throw `Log channel (${target.channel}) is of the wrong channel type.`;

                        await log.send(embed("New Modmail Thread", `A modmail thread was just opened with ${user}: ${channel}.`, Colors.Green));
                    } catch (error) {
                        logError(_.guild!.id, "Posting modmail log entry", `Error posting log message:\n\`\`\`\n${error}\n\`\`\``);
                    }
                }

                if (entry) await trpc.reviveModmailThread.mutate({ uuid: entry.uuid, channel: channel.id, user: user.id, targetName: target.name });
                else
                    await trpc.createModmailThread.mutate({
                        guild: _.guild!.id,
                        user: user.id,
                        targetId: target.id,
                        targetName: target.name,
                        channel: channel.id,
                    });

                await channel
                    .send({
                        embeds: [
                            {
                                title: "Modmail Thread Opened",
                                description: `This modmail thread was just opened by ${_.user} to contact ${user}.`,
                                color,
                            },
                        ],
                    })
                    .catch((error) =>
                        logError(
                            _.guild!.id,
                            "Posting modmail initialization message",
                            `Error posting modmail initialization message:\n\`\`\`\n${error}\n\`\`\``,
                        ),
                    );

                await _.editReply(template.success(`${channel}`));
            }),
    );
