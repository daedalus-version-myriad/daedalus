import { trpc } from "../../api/index.js";
import { template, type Commands } from "../../bot-utils/index.js";
import { secrets } from "../../config/index.js";
import { ButtonStyle, Colors, ComponentType } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("ticket close")
            .description("close a ticket")
            .fn(async ({ _ }) => {
                const ticket = await trpc.getTicket.query(_.channel!.id);
                if (!ticket) throw "This is not a ticket channel.";

                const { uuid, user, prompt, target } = ticket;

                await _.deferReply();

                await trpc.closeTicket.mutate({ uuid, author: _.user.id });

                try {
                    const config = await trpc.getTicketsConfig.query(_.guild!.id);

                    const obj = config.prompts.find((p) => p.id === prompt)?.targets.find((t) => t.id === target);
                    if (!obj?.channel) throw 0;

                    const channel = await _.guild!.channels.fetch(obj.channel);
                    if (!channel?.isTextBased()) throw 0;

                    await channel.send({
                        embeds: [{ title: "Ticket Closed", description: `<@${user}>'s ticket was closed.`, color: Colors.Red }],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        style: ButtonStyle.Link,
                                        label: "View on Dashboard",
                                        url: `${secrets.DOMAIN}/ticket/${uuid}`,
                                    },
                                ],
                            },
                        ],
                    });

                    return template.success("This ticket is now closed!");
                } catch (error) {
                    console.error(error);
                    throw "The ticket has been closed, but the log message could not be posted.";
                } finally {
                    setTimeout(() => _.channel!.delete(), 5000);
                }
            }),
    );
