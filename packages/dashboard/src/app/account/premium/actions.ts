"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";

export async function provisionNewKey(type: "premium" | "custom") {
    const id = await getId();
    if (!id) return null;

    return await trpc.provisionKey.mutate({ owner: id, type });
}

export async function deleteKey(key: string) {
    const id = await getId();
    if (!id) return null;

    await trpc.deleteKey.mutate({ owner: id, key });
}
