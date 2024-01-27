"use server";

import { trpc } from "@daedalus/api";
import { GuildSettings } from "@daedalus/types";

export default async function save(data: GuildSettings) {
    return await trpc.setSettings.mutate(data);
}
