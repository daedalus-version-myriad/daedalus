"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";

export function SaveChangesBar({ unsaved, reset, save }: { unsaved: boolean; reset: () => unknown; save: () => unknown }) {
    const [saving, setSaving] = useState(false);

    const doSave = useCallback(async () => {
        setSaving(true);

        try {
            await save();
        } catch {}

        setSaving(false);
    }, [save]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => unsaved && e.preventDefault();

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [unsaved]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                if (unsaved) doSave();
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [unsaved, doSave]);

    return (
        <div
            className={`z-10 fixed left-0 right-0 ${unsaved ? "bottom-20" : "-bottom-32"} center-row justify-between mx-4 sm:mx-12 md:mx-24 lg:mx-32 xl:mx-48 px-5 py-3 rounded drop-shadow-2xl bg-muted`}
            style={{
                transition: unsaved
                    ? "bottom 320ms cubic-bezier(0.4, 1, 0.6, 1.2), background-color 200ms"
                    : "bottom 320ms cubic-bezier(0.4, -0.32, 1, 0.6), background-color 200ms",
            }}
        >
            <span className="text-muted-foreground">YOU HAVE UNSAVED CHANGES</span>
            <div className="center-row gap-2">
                <Button variant="ghost" className="text-[#ff0000] hover:text-[#ff0000cc]" onClick={reset} disabled={saving}>
                    RESET
                </Button>
                <Button className="text-[#008800] hover:text-[#008800cc]" onClick={doSave} disabled={saving}>
                    SAVE
                </Button>
            </div>
        </div>
    );
}
