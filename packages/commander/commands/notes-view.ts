import { trpc } from "@daedalus/api";
import { getColor, type Commands } from "@daedalus/bot-utils";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("notes view")
            .description("view a user's mod notes (visible to others in this channel)")
            .userOption("user", "the user to view", { required: true })
            .fn(async ({ _, user }) => {
                const notes = await trpc.getUserNotes.query({ guild: _.guild!.id, user: user.id });
                if (!notes) throw `${user} does not have any mod notes.`;

                return {
                    embeds: [{ title: `Mod notes for ${user.tag}`, description: notes, color: await getColor(_.guild!), footer: { text: user.id } }],
                };
            }),
    );
