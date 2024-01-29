"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { GuildPremiumSettings } from "@daedalus/types";

export async function reloadData(guild: string) {
    return await trpc.getPremiumSettings.query({ id: await getId(), guild });
}

export async function bindKey(guild: string, key: string): Promise<string | void> {
    return await trpc.bindKey.mutate({ id: await getId(), key, guild });
}

export async function unbindKey(guild: string, key: string): Promise<string | void> {
    return await trpc.unbindKey.mutate({ id: await getId(), key, guild });
}

export async function bindToken(guild: string, token: string | null): Promise<string | void> {
    return await trpc.bindToken.mutate({ id: await getId(), guild, token });
}

export async function updateStatus(guild: string, data: Pick<GuildPremiumSettings, "status" | "activityType" | "activity">) {
    return await trpc.setStatus.mutate({ id: await getId(), guild, ...data });
}
