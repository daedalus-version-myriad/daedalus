import { secrets } from "@daedalus/config";
import { cookies } from "next/headers";

const DISCORD_ENDPOINT = (path: string, state: string) =>
    `${secrets.DISCORD.API}/oauth2/authorize?${new URLSearchParams({
        client_id: secrets.DISCORD.CLIENT.ID,
        redirect_uri: `${secrets.DOMAIN}/auth/callback`,
        response_type: "code",
        scope: "identify guilds",
        state: state + path,
    })}`;

export async function GET({ url }: Request) {
    const state = String.fromCharCode(...new Array(32).fill(0).map(() => Math.floor(Math.random() * 94) + 33));
    const headers = new Headers({ Location: DISCORD_ENDPOINT(new URL(url).searchParams.get("redirect") ?? "/", state) });
    cookies().set("state", state, { path: "/", httpOnly: true, sameSite: "lax", expires: new Date(Date.now() + 10 * 60 * 1000) });
    return new Response(null, { headers, status: 303 });
}
