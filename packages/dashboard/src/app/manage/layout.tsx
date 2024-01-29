"use client";

import { useUserContext } from "@/context/user";
import { redirect, usePathname } from "next/navigation";
import React from "react";

export default function ManageLayout({ children }: React.PropsWithChildren) {
    const user = useUserContext();
    const pathname = usePathname();

    if (!user) return void redirect(`/auth/login?redirect=${encodeURIComponent(pathname)}`);

    return <>{children}</>;
}
