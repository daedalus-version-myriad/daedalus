"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildSuggestionsSettings } from "@daedalus/types";

export default async function save(data: GuildSuggestionsSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setSuggestionsSetttings.mutate({ id: await getId(), ...data }));
}
