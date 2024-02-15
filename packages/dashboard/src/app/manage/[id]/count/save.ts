"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildCountSettings } from "@daedalus/types";

export default async function save(data: GuildCountSettings<true>): Promise<[string | null, GuildCountSettings<true>] | void> {
    return await trpcSave(
        async () => await trpc.setCountSettings.mutate({ id: await getId(), ...data }),
        (e) => [e, data],
    );
}
