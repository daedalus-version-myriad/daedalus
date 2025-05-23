"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { Body } from "./page-body";

export default async function ManageCountChannels({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main id={id}></Main>
        </Suspense>
    );
}

async function Main({ id }: { id: string }) {
    const user = await getId();
    const data = await trpc.getCountSettings.query({ id: user, guild: id });

    return (
        <Body
            data={data}
            limit={(await trpc.getLimit.query({ id: user, guild: id, key: "countCountLimit" })) as number}
            disabled={!(await trpc.isModuleEnabled.query({ guild: id, module: "count" }))}
        ></Body>
    );
}
