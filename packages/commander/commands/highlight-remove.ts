import { trpc } from "@daedalus/api";
import { defer, template, type Commands } from "@daedalus/bot-utils";
import { stem } from "@daedalus/highlights";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("highlight remove")
            .description("remove a word/phrase from your highlights")
            .stringOption("word-or-phrase", "the word or phrase to remove", { required: true, maxLength: 75 })
            .fn(defer(true))
            .fn(async ({ _, "word-or-phrase": phrase }) => {
                const display = phrase.replaceAll(/\s+/g, " ");
                const match = stem(display).join(" ");

                if (match.length < 3) throw "You do not have that phrase highlighted.";

                const phrases = await trpc.getHighlightPhrases.query({ guild: _.guild!.id, user: _.user.id });
                const found = phrases.includes(match);

                if (!found) throw "You do not have that phrase highlighted.";

                await trpc.removeHighlight.mutate({ guild: _.guild!.id, user: _.user.id, phrase: match });

                return template.success(
                    `Removed \`${display}\` from your highlights${display === match ? "" : ` (stored as \`${match}\`, which is equivalent).`}`,
                );
            }),
    );
