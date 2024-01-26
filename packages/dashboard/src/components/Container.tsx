import React from "react";

export default function Container({ children }: React.PropsWithChildren) {
    return <div className="w-full px-[calc(max(5%,50%-600px))]">{children}</div>;
}
