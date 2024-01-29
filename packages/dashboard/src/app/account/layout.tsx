"use client";

import { useUserContext } from "@/context/user";
import { redirect, usePathname } from "next/navigation";
import React from "react";
import { FaCrown, FaGear } from "react-icons/fa6";
import { IconType } from "react-icons/lib";

export const categories: [string, IconType, string][] = [
    ["", FaGear, "Account Settings"],
    ["/premium", FaCrown, "Premium"],
];

export default function ManageLayout({ children }: React.PropsWithChildren) {
    const user = useUserContext();
    const pathname = usePathname();

    if (!user) return void redirect(`/auth/login?redirect=${encodeURIComponent(pathname)}`);

    return (
        <div className="grid grid-cols-[max-content_1fr]">
            <div className="hidden md:block h-[calc(100vh-8rem)] border-r flex flex-col overflow-y-scroll">
                {categories.map(([suffix, icon, label]) => (
                    <a
                        href={`/account${suffix}`}
                        key={suffix}
                        className={`px-4 py-2 center-row gap-4 ${pathname.endsWith(`account${suffix}`) ? "bg-muted" : ""}`}
                    >
                        {icon({})} {label}
                    </a>
                ))}
            </div>
            <div className="md:hidden"></div>
            <div className="h-[calc(100vh-8rem)] p-8 bg-muted/20 overflow-y-scroll">{children}</div>
        </div>
    );
}
