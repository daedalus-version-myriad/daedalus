"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { Body } from "./page-body";

export default async function ManageSuggestions({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main id={id}></Main>
        </Suspense>
    );
}

async function Main({ id }: { id: string }) {
    const data = await trpc.getSuggestionsSettings.query({ id: await getId(), guild: id });
    return <Body data={data} disabled={!(await trpc.isModuleEnabled.query({ guild: id, module: "suggestions" }))}></Body>;
}
