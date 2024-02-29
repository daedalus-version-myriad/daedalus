"use server";

import { secrets } from "@daedalus/config";
import PartnersBody from "./page-body";

export default async function Partners() {
    const tcnReq = await fetch(`${secrets.TCN.API}/stats`).catch(() => null);
    const tcnRes = tcnReq?.ok ? await tcnReq.json().catch(() => null) : null;

    return <PartnersBody tcnSize={(tcnRes as { guilds: number } | null)?.guilds ?? null}></PartnersBody>;
}
