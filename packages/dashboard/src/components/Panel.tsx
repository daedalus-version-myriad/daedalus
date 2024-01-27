import React from "react";

export default function Panel({ children }: { children: React.ReactNode }) {
    return <div className="border bg-muted-foreground/5 p-4 my-2 rounded-lg flex flex-col gap-4">{children}</div>;
}
