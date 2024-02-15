"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildNukeguardSettings } from "@daedalus/types";

export default async function save(data: GuildNukeguardSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setNukeguardSettings.mutate({ id: await getId(), ...data }));
}
