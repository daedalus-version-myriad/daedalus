"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildCoOpSettings } from "@daedalus/types";

export default async function save(data: GuildCoOpSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setCoOpSettings.mutate({ id: await getId(), ...data }));
}
