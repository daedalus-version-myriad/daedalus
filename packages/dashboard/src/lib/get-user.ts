"use server";

import { trpc } from "@daedalus/api";
import { DISCORD_API } from "@daedalus/config/public";
import { cookies } from "next/headers";
import { User } from "./types";

export async function getToken(): Promise<string | undefined> {
    return cookies().get("discord_access_token")?.value;
}

export async function getId(token?: string): Promise<string | null> {
    token ??= await getToken();
    if (!token) return null;

    let id: string | undefined;

    if (token) {
        const userReq = await fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${token}` } });
        const userRes = await userReq.json();

        if (userRes.id) id = userRes.id;
    }

    return id ?? null;
}

export default async function getUser(token?: string): Promise<User | null> {
    const id = await getId(token);
    if (id === null) return null;

    return await trpc.userGet.query(id);
}
