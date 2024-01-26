import { cookies } from "next/headers";

export async function GET({ url }: Request) {
    const headers = new Headers({ Location: new URL(url).searchParams.get("redirect") ?? "/" });
    cookies().delete("discord_access_token");
    cookies().delete("discord_refresh_token");
    return new Response(null, { headers, status: 302 });
}
