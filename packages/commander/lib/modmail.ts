import { trpc } from "@daedalus/api";
import { fuzzy } from "@daedalus/global-utils";
import type { SlashUtil } from "argentium/src/slash-util";

export const addModmailReplyOptions = <T>(x: SlashUtil<T>) =>
    x
        .booleanOption("anon", "if true, hide your name and top role in the reply")
        .fileOption("file-1", "a file to include in the reply")
        .fileOption("file-2", "a file to include in the reply")
        .fileOption("file-3", "a file to include in the reply")
        .fileOption("file-4", "a file to include in the reply")
        .fileOption("file-5", "a file to include in the reply")
        .fileOption("file-6", "a file to include in the reply")
        .fileOption("file-7", "a file to include in the reply")
        .fileOption("file-8", "a file to include in the reply")
        .fileOption("file-9", "a file to include in the reply")
        .fileOption("file-10", "a file to include in the reply");

export const addModmailSnippetOption = <T>(x: SlashUtil<T>) =>
    x.stringOption("snippet", "the name of the snippet", {
        required: true,
        maxLength: 100,
        async autocomplete(query, _) {
            const snippets = await trpc.getModmailSnippets.query(_.guild!.id);

            return snippets
                .filter((x) => fuzzy(x.name, query))
                .map((x) => ({ name: x.name, value: x.name.slice(0, 100) }))
                .slice(0, 25);
        },
    });

export const addModmailSnippetSendOption = <T>(x: SlashUtil<T>) => x.booleanOption("anon", "if true, hide your name and top role in the reply");
