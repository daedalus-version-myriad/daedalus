"use server";

import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { AccountSettings } from "@daedalus/types";

export default async function save(data: AccountSettings): Promise<string | void> {
    return await trpc.setAccountSettings.mutate({ id: await getId(), ...data });
}
