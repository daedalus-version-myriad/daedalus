import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/_next")) return;

    let refresh_token = request.cookies.get("discord_refresh_token")?.value;
    let access_token = request.cookies.get("discord_access_token")?.value;
    let expires_in: number = 0;

    let setTokens = false;

    if (refresh_token && !access_token) {
        const oauth2Request = await fetch(`${process.env.DISCORD_API}/oauth2/token`, {
            method: "post",
            body: new URLSearchParams({ client_id: process.env.CLIENT_ID!, client_secret: process.env.SECRET!, grant_type: "refresh_token", refresh_token }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        if (oauth2Request.ok) {
            ({ access_token, refresh_token, expires_in } = <{ access_token: string; refresh_token: string; expires_in: number }>await oauth2Request.json());
            setTokens = true;
        }
    }

    if (setTokens) {
        request.cookies.set("discord_access_token", access_token ?? "");
        request.cookies.set("discord_refresh_token", refresh_token ?? "");
    }

    const response = NextResponse.next({ request });

    if (setTokens) {
        response.cookies.set("discord_access_token", access_token ?? "", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            expires: new Date(Date.now() + expires_in - 10000),
        });

        response.cookies.set("discord_refresh_token", refresh_token ?? "", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
    }

    return response;
}
