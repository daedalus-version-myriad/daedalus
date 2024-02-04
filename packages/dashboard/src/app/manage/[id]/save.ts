"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildSettings } from "@daedalus/types";

export default async function save(data: GuildSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setSettings.mutate({ id: await getId(), ...data }));
}
