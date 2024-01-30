"use client";

import { manageGuildCategories } from "@/lib/data";
import { usePathname } from "next/navigation";
import React from "react";

export default function ManageLayoutBody({ children, id, name }: { children: React.ReactNode; id: string; name: string }) {
    const pathname = usePathname();

    return (
        <div className="grid grid-cols-[max-content_1fr]">
            <div className="hidden md:block h-[calc(100vh-8rem)] border-r flex flex-col overflow-y-scroll">
                {manageGuildCategories.map(([suffix, icon, label]) => (
                    <a
                        href={`/manage/${id}${suffix}`}
                        key={suffix}
                        className={`px-4 py-2 center-row gap-4 ${pathname.endsWith(`${id}${suffix}`) ? "bg-muted" : ""}`}
                    >
                        {icon({})} {label}
                    </a>
                ))}
            </div>
            <div className="md:hidden"></div>
            <div className="h-[calc(100vh-8rem)] p-8 bg-muted/20 overflow-y-scroll">
                <p className="text-lg mb-4 text-muted-foreground">
                    Managing <b>{name}</b>
                </p>
                {children}
            </div>
        </div>
    );
}
