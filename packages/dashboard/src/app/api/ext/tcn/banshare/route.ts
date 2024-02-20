import { trpc } from "@daedalus/api";
import { secrets } from "@daedalus/config";
import crypto from "crypto";

export async function POST({ url: raw }: Request) {
    const url = new URL(raw);

    const server = url.searchParams.get("g");
    const userid = url.searchParams.get("u");
    const reason = url.searchParams.get("r");
    const origin = url.searchParams.get("o");
    const tcnbot = url.searchParams.get("i");
    const hmac = url.searchParams.get("h");

    if (!server || !userid || !reason || !origin || !tcnbot || !hmac) return new Response("", { status: 400 });

    if (
        !crypto.timingSafeEqual(
            Buffer.from(hmac, "base64url"),
            crypto.createHmac("sha256", secrets.TCN_HMAC_KEY).update(`${server} ${userid} ${reason} ${origin} ${tcnbot}`).digest(),
        )
    )
        return new Response("", { status: 403 });

    await trpc.addUserHistory.mutate({ guild: server, user: userid, type: "ban", mod: tcnbot, duration: Infinity, origin, reason });

    return new Response();
}
