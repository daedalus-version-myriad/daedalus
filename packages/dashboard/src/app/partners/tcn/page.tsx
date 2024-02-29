import { secrets } from "@daedalus/config";
import TCNBody from "./page-body";

export default async function TCN() {
    const tcnReq = await fetch(`${secrets.TCN.API}/guilds`).catch(() => null);
    const tcnRes = tcnReq?.ok ? await tcnReq.json().catch(() => null) : null;

    return <TCNBody guilds={(tcnRes ?? []) as any}></TCNBody>;
}
