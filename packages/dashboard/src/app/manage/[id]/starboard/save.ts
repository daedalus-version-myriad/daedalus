"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildStarboardSettings } from "@daedalus/types";

export default async function save(data: GuildStarboardSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setStarboardSettings.mutate({ id: await getId(), ...data }));
}
