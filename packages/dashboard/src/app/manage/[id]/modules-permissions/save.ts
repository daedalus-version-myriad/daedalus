"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { GuildModulesPermissionsSettings } from "@daedalus/types";

export default async function save(data: GuildModulesPermissionsSettings): Promise<string | void> {
    return await trpc.setModulesPermissionsSettings.mutate({ id: await getId(), ...data });
}
