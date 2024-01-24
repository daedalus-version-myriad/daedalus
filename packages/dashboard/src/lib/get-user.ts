"use server";

import { trpc } from "@daedalus/api";
import { secrets } from "@daedalus/config";
import { getServerSession } from "next-auth";

export default async function () {
    return await getServerSession({
        secret: secrets.NEXT_AUTH_SECRET,
        callbacks: {
            async session(session) {
                return {
                    id: session.token.sub!,
                    name: session.token.name!,
                    image: session.token.picture!,
                    admin: await trpc.isAdmin.query(session.token.sub!),
                };
            },
        },
    });
}
