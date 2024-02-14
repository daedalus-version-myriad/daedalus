"use server";

import LoadingManagePage from "@/components/LoadingManagePage";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { Body } from "./page-body";

export default async function ManageTickets({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense fallback={<LoadingManagePage></LoadingManagePage>}>
            <Main id={id}></Main>
        </Suspense>
    );
}

async function Main({ id }: { id: string }) {
    const user = await getId();
    const data = await trpc.getTicketsSettings.query({ id: user, guild: id });
    return (
        <Body
            data={data}
            canUseMulti={(await trpc.getLimit.query({ id: user, guild: id, key: "multiTickets" })) as boolean}
            promptLimit={(await trpc.getLimit.query({ id: user, guild: id, key: "ticketPromptCountLimit" })) as number}
            targetLimit={(await trpc.getLimit.query({ id: user, guild: id, key: "ticketTargetCountLimit" })) as number}
            canCustomize={(await trpc.getLimit.query({ id: user, guild: id, key: "customizeTicketOpenMessage" })) as boolean}
            disabled={!(await trpc.isModuleEnabled.query({ guild: id, module: "tickets" }))}
        ></Body>
    );
}
