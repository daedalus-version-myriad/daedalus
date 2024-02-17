import { trpc } from "@daedalus/api";
import { defer, template, type Commands } from "@daedalus/bot-utils";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("highlight clear")
            .description("clear all of your highlights")
            .fn(defer(true))
            .fn(async ({ _ }) => {
                const { phrases, replies } = await trpc.getHighlightData.query({ guild: _.guild!.id, user: _.user.id });
                if (phrases.length === 0 && !replies) throw "You have no highlights enabled right now.";

                await trpc.clearHighlights.mutate({ guild: _.guild!.id, user: _.user.id });

                if (phrases.length === 0) return template.success("You have no phrases highlighted. Reply highlighting was turned off.");

                return template.success(
                    `Your highlighted phrases (listed below) have been cleared${replies ? " and reply highlighting has been turned off" : ""}.\n\n${phrases.map((phrase) => `- \`${phrase}\``).join("\n")}`,
                );
            }),
    );
