"use server";

import { getId, getToken } from "@/lib/get-user";
import { Guild } from "@/lib/types";
import { trpc } from "@daedalus/api";

export async function fetchGuilds(): Promise<Guild[]> {
    const token = await getToken();
    if (!token) return [];

    const id = await getId(token);
    if (!id) return [];

    return await trpc.userGuilds.query({ id, token });
}
