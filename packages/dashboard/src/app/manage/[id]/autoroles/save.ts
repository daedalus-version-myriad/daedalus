"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildAutorolesSettings } from "@daedalus/types";

export default async function save(data: GuildAutorolesSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setAutorolesSettings.mutate({ id: await getId(), ...data }));
}
