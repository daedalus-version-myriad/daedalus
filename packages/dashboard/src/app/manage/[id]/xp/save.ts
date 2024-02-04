"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildXpSettings } from "@daedalus/types";

export default async function save(data: GuildXpSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setXpSettings.mutate({ id: await getId(), ...data }));
}
