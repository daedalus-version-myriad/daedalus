"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildAutoresponderSettings } from "@daedalus/types";

export default async function save(data: GuildAutoresponderSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setAutoresponderSettings.mutate({ id: await getId(), ...data }));
}
