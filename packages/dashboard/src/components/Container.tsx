import React from "react";

export default function Container({ children, className }: React.PropsWithChildren<{ className?: string }>) {
    return <div className={`w-full px-[calc(max(5%,50%-600px))] ${className ?? ""}`}>{children}</div>;
}
