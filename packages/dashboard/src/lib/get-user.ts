"use server";

import { trpc } from "@daedalus/api";
import { secrets } from "@daedalus/config";
import { getServerSession } from "next-auth";

export default async function () {
    return await getServerSession({
        secret: secrets.NEXT_AUTH_SECRET,
        callbacks: {
            async session(session) {
                const id = session.token.sub;
                if (!id) return null;

                return await trpc.userGet.query(id);
            },
        },
    });
}
