"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { AccountPremiumBody } from "./page-body";

export default async function AccountPremium() {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main></Main>
        </Suspense>
    );
}

async function Main() {
    const id = await getId();
    if (!id) return <></>;

    const data = await trpc.premiumPageDataGet.query(id);

    return <AccountPremiumBody {...data}></AccountPremiumBody>;
}
