"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import getUser from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { Body } from "./page-body";

export default async function ManageLogging({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main id={id}></Main>
        </Suspense>
    );
}

async function Main({ id }: { id: string }) {
    const user = await getUser();
    const data = await trpc.getLoggingSettings.query({ id: user?.id ?? null, guild: id });
    return <Body data={data} owner={!!user?.owner} disabled={!(await trpc.isModuleEnabled.query({ guild: id, module: "logging" }))}></Body>;
}
