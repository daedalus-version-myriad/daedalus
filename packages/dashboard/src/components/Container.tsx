import React from "react";

export default function Container({ children }: React.PropsWithChildren) {
    return <div className="w-full px-[calc(max(10px,50%-400px))]">{children}</div>;
}
