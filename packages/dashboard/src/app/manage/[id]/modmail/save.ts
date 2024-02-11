"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildModmailSettings } from "@daedalus/types";

export default async function save(data: GuildModmailSettings): Promise<[string | null, GuildModmailSettings] | void> {
    return await trpcSave(
        async () => await trpc.setModmailSettings.mutate({ id: await getId(), ...data }),
        (e) => [e, data],
    );
}
