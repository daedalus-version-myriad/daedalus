"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildAutomodSettings } from "@daedalus/types";

export default async function save(data: GuildAutomodSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setAutomodSettings.mutate({ id: await getId(), ...data }));
}
