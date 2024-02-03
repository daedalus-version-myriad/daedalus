"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { GuildSupporterAnnouncementsSettings } from "@daedalus/types";

export default async function save(data: GuildSupporterAnnouncementsSettings): Promise<string | void> {
    return await trpc.setSupporterAnnouncementsSettings.mutate({ id: await getId(), ...data });
}
