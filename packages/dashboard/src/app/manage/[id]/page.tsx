"use server";

import { trpc } from "@daedalus/api";
import { Suspense } from "react";
import { Body } from "./page-body";

export default async function ManageRoot({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense fallback={<>Loading</>}>
            <Body data={await trpc.getSettings.query(id)}></Body>
        </Suspense>
    );
}
