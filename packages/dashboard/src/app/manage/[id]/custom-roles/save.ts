"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildCustomRolesSettings } from "@daedalus/types";

export default async function save(data: GuildCustomRolesSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setCustomRolesSettings.mutate({ id: await getId(), ...data }));
}
