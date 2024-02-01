"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";

export default async function enableModule(guild: string, module: string) {
    try {
        await trpc.enableModule.mutate({ id: await getId(), guild, module });
    } catch (error) {
        return `${error}`;
    }
}
