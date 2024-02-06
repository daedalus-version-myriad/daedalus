"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { Body } from "./page-body";

export default async function ManageSupporterAnnouncements({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main id={id}></Main>
        </Suspense>
    );
}

async function Main({ id }: { id: string }) {
    const user = await getId();

    const data = await trpc.getSupporterAnnouncementsSettings.query({ id: user, guild: id });
    return (
        <Body
            data={data}
            limit={(await trpc.getLimit.query({ id: user, guild: id, key: "supporterAnnouncementsCountLimit" })) as number}
            disabled={!(await trpc.isModuleEnabled.query({ guild: id, module: "supporter-announcements" }))}
        ></Body>
    );
}
