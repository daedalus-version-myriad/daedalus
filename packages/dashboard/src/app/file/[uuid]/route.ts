import { trpc } from "@daedalus/api";

export async function GET({ url }: Request) {
    const uuid = new URL(url).pathname.slice(6, 42);
    const goto = await trpc.getFile.query(uuid);
    return new Response(null, { headers: { Location: goto ?? "/file-issue" }, status: 302 });
}
