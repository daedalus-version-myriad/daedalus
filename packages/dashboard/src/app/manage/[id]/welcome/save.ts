"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { GuildWelcomeSettings } from "@daedalus/types";

export default async function save(data: GuildWelcomeSettings): Promise<string | void> {
    return await trpc.setWelcomeSettings.mutate({ id: await getId(), ...data });
}
