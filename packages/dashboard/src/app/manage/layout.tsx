"use client";

import { useUserContext } from "@/context/user";
import { redirect } from "next/navigation";
import React from "react";

export default function ManageLayout({ children }: React.PropsWithChildren) {
    const user = useUserContext();
    if (!user) return void redirect("/auth/login?redirect=/manage");

    return <>{children}</>;
}
