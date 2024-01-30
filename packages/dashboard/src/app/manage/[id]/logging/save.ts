"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { GuildLoggingSettings } from "@daedalus/types";

export default async function save(data: GuildLoggingSettings): Promise<string | void> {
    return await trpc.setLoggingSettings.mutate({ id: await getId(), ...data });
}
