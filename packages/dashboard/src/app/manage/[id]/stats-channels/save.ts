"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildStatsChannelsSettings } from "@daedalus/types";

export default async function save(data: GuildStatsChannelsSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setStatsChannelsSettings.mutate({ id: await getId(), ...data }));
}
