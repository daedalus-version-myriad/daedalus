import React from "react";

export default function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`${className} border bg-muted-foreground/5 p-4 my-2 rounded-lg flex flex-col gap-4`}>{children}</div>;
}
