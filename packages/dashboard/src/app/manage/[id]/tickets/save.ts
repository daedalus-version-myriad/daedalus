"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildTicketsSettings } from "@daedalus/types";

export default async function save(data: GuildTicketsSettings): Promise<[string | null, GuildTicketsSettings] | void> {
    return await trpcSave(
        async () => await trpc.setTicketsSettings.mutate({ id: await getId(), ...data }),
        (e) => [e, data],
    );
}
