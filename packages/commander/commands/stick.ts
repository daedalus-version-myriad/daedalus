import { trpc } from "@daedalus/api";
import type { Commands } from "@daedalus/bot-utils";
import { ComponentType, TextInputStyle } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("stick")
            .description("set the channel's sticky message")
            .numberOption("seconds", "the minimum number of seconds to wait between reposts (minimum and default: 4)")
            .fn(async ({ _, seconds }) => {
                const entry = await trpc.getStickyMessage.query(_.channel!.id);

                await _.showModal({
                    customId: `:stick:${seconds ?? 4}`,
                    title: "Sticky Message",
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.TextInput,
                                    style: TextInputStyle.Paragraph,
                                    customId: "message",
                                    label: "Message",
                                    value: entry?.content,
                                    required: true,
                                    maxLength: 2000,
                                },
                            ],
                        },
                    ],
                });
            }),
    );
