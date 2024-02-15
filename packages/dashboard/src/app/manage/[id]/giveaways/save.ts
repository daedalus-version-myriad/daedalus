"use server";

import { getId } from "@/lib/get-user";
import { trpcSave } from "@/lib/save-util";
import { trpc } from "@daedalus/api";
import { GuildGiveawaySettings } from "@daedalus/types";

export default async function save(data: GuildGiveawaySettings): Promise<[string | null, GuildGiveawaySettings] | void> {
    return await trpcSave(
        async () => await trpc.setGiveawaySettings.mutate({ id: await getId(), ...data }),
        (e) => [e, data],
    );
}
