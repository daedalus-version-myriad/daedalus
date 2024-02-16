"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildUtilitySettings } from "@daedalus/types";

export default async function save(data: GuildUtilitySettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setUtilitySettings.mutate({ id: await getId(), ...data }));
}
