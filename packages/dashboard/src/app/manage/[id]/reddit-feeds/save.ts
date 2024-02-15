"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildRedditFeedsSettings } from "@daedalus/types";

export default async function save(data: GuildRedditFeedsSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setRedditFeedsSettings.mutate({ id: await getId(), ...data }));
}
