"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildStickyRolesSettings } from "@daedalus/types";

export default async function save(data: GuildStickyRolesSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setStickyRolesSettings.mutate({ id: await getId(), ...data }));
}
