"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { AccountRootBody } from "./page-body";

export default async function AccountRoot() {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main></Main>
        </Suspense>
    );
}

async function Main() {
    const id = await getId();
    if (!id) return <></>;

    const data = await trpc.getAccountSettings.query(id);

    return <AccountRootBody {...data}></AccountRootBody>;
}
