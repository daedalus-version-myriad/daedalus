"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildLoggingSettings } from "@daedalus/types";

export default async function save(data: GuildLoggingSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setLoggingSettings.mutate({ id: await getId(), ...data }));
}
