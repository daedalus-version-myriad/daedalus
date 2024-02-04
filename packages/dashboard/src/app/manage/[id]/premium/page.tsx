"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import getUser from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { Body } from "./page-body";

export default async function ManagePremium({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main id={id}></Main>
        </Suspense>
    );
}

async function Main({ id }: { id: string }) {
    const user = await getUser(undefined, id);
    if (!user) return <></>;

    const data = await trpc.getPremiumSettings.query({ id: user.id, guild: id });
    return <Body data={data} owner={user.owner}></Body>;
}
