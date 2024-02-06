"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildReactionRolesSettings } from "@daedalus/types";

export default async function save(data: GuildReactionRolesSettings): Promise<[string | null, GuildReactionRolesSettings] | void> {
    return await trpcSave(
        async () => await trpc.setReactionRolesSettings.mutate({ id: await getId(), ...data }),
        (e) => [e, data],
    );
}
