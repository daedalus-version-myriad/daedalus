"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildWelcomeSettings } from "@daedalus/types";

export default async function save(data: GuildWelcomeSettings): Promise<string | void> {
    return await trpcSave(async () => await trpc.setWelcomeSettings.mutate({ id: await getId(), ...data }));
}
