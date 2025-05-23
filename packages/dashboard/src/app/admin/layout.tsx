"use client";

import { useUserContext } from "@/context/user";
import { redirect } from "next/navigation";
import React from "react";

export default function AdminLayout({ children }: React.PropsWithChildren) {
    const user = useUserContext();
    if (!user?.admin) return void redirect("/");
    return <>{children}</>;
}
