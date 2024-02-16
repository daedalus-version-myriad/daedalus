"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildReportsSettings } from "@daedalus/types";

export default async function save(data: GuildReportsSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setReportsSettings.mutate({ id: await getId(), ...data }));
}
