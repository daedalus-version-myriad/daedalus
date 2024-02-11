import React from "react";

export default function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`${className} border bg-muted/20 my-2 rounded-lg overflow-x-scroll`}>
            <div className="min-w-[min-content] flex flex-col gap-4 p-4">{children}</div>
        </div>
    );
}
