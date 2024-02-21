import { trpc } from "../../api/index.js";
import { truncate, type Commands } from "../../bot-utils/index.js";
import { ComponentType, TextInputStyle } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("notes edit")
            .description("open a user's mod notes in a private modal in edit-mode")
            .userOption("user", "the user to open", { required: true })
            .fn(async ({ _, user }) => {
                const notes = await trpc.getUserNotes.query({ guild: _.guild!.id, user: user.id });

                await _.showModal({
                    title: `Editing Mod Notes for ${truncate(user.tag, 43)}`,
                    customId: `:notes/edit:${user.id}`,
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.TextInput,
                                    customId: "notes",
                                    style: TextInputStyle.Paragraph,
                                    label: "Notes",
                                    value: notes ?? "",
                                    required: false,
                                },
                            ],
                        },
                    ],
                });
            }),
    );
