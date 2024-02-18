"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildAutokickSettings } from "@daedalus/types";

export default async function save(data: GuildAutokickSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setAutokickSettings.mutate({ id: await getId(), ...data }));
}
