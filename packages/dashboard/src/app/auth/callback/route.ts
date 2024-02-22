import { cookies } from "next/headers";

const fail = (path = "/") => new Response(null, { headers: { Location: path }, status: 302 });

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) return fail();

    const state = url.searchParams.get("state");
    if (!state || state.substring(0, 32) !== cookies().get("state")?.value) return fail("/state-mismatch");

    const request = await fetch(`${process.env.DISCORD_API}/oauth2/token`, {
        method: "post",
        body: new URLSearchParams({
            client_id: process.env.CLIENT_ID!,
            client_secret: process.env.SECRET!,
            grant_type: "authorization_code",
            redirect_uri: `${process.env.DOMAIN}/auth/callback`,
            code,
            scope: "identify guilds",
        }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!request.ok) {
        console.error(await request.text());
        return fail();
    }

    const response = await request.json();

    const access_token_exp = new Date(Date.now() + response.expires_in - 10000);
    const refresh_token_exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const headers = new Headers({ Location: state.substring(32) });
    cookies().set("discord_access_token", response.access_token, { path: "/", httpOnly: true, sameSite: "lax", expires: access_token_exp });
    cookies().set("discord_refresh_token", response.refresh_token, { path: "/", httpOnly: true, sameSite: "lax", expires: refresh_token_exp });

    return new Response(null, { headers, status: 303 });
}
