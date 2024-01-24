"use server";

import getUser from "@/lib/get-user";
import { redirect } from "next/navigation";
import React from "react";

export default async function AdminLayout({ children }: React.PropsWithChildren) {
    const user = await getUser();

    if (!user?.admin) return void redirect("/");

    return <>{children}</>;
}
