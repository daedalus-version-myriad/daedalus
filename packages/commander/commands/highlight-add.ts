import { trpc } from "@daedalus/api";
import { defer, template, type Commands } from "@daedalus/bot-utils";
import { stem } from "@daedalus/highlights";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("highlight add")
            .description("add a word/phrase to your highlights")
            .stringOption("word-or-phrase", "the word or phrase to add", { required: true, maxLength: 75 })
            .fn(defer(true))
            .fn(async ({ _, "word-or-phrase": phrase }) => {
                const display = phrase.replaceAll(/\s+/g, " ");
                const match = stem(display).join(" ");

                if (match.length < 3) throw "Please highlight a longer word/phrase.";

                const phrases = await trpc.getHighlightPhrases.query({ guild: _.guild!.id, user: _.user.id });
                const found = phrases.includes(match);

                if (found) throw `You already have that phrase highlighted${display === match ? "" : ` (stored as \`${match}\`, which is equivalent).`}`;

                if (phrases.length >= 50) throw "You have reached the per-server limit of 50 highlighted phrases.";

                await trpc.addHighlight.mutate({ guild: _.guild!.id, user: _.user.id, phrase: match });
                return template.success(`Added \`${display}\` to your highlights${display === match ? "" : ` (stored as \`${match}\`, which is equivalent).`}`);
            }),
    );
